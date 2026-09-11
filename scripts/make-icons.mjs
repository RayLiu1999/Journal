import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#F4EDE0"/>
  <rect x="136" y="96" width="240" height="320" rx="24" fill="#FCF9F3" stroke="#E2D7C3" stroke-width="10"/>
  <path d="M184 176h144M184 232h144M184 288h96" stroke="#E2D7C3" stroke-width="14" stroke-linecap="round"/>
  <path d="M300 392l84-84a20 20 0 0 0-28-28l-84 84-8 36z" fill="#F3E1D3" stroke="#B4552F" stroke-width="12" stroke-linejoin="round"/>
</svg>`

await mkdir('public/icons', { recursive: true })
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`)
}
console.log('icons written')
