import { requireUser } from '../../utils/auth'

export default defineEventHandler((event) => ({ user: requireUser(event) }))
