import { getRequestURL, sendRedirect, setHeader } from 'h3'
import { getSessionUser } from '../utils/auth'

const publicPaths = new Set([
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/sw.js',
])

function isPublicPath(pathname: string) {
  return publicPaths.has(pathname)
    || pathname === '/login/'
    || pathname.startsWith('/_nuxt/')
    || pathname.startsWith('/icons/')
    || pathname.startsWith('/workbox-')
}

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)
  const { pathname } = requestUrl
  if (isPublicPath(pathname)) {
    if (pathname === '/login' || pathname === '/login/' || pathname.startsWith('/api/auth/')) {
      setHeader(event, 'cache-control', 'no-store')
    }
    return
  }

  const user = getSessionUser(event)
  if (user) {
    setHeader(event, 'cache-control', 'no-store')
    event.context.auth = user
    return
  }

  if (pathname.startsWith('/api/')) {
    setHeader(event, 'cache-control', 'no-store')
    throw createError({ statusCode: 401, statusMessage: '需要登入' })
  }

  setHeader(event, 'cache-control', 'no-store')
  const target = `${pathname}${requestUrl.search}`
  return sendRedirect(event, `/login?redirect=${encodeURIComponent(target)}`, 302)
})
