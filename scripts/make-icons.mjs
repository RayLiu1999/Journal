import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const source = 'scripts/assets/pwa-icon-master.png'
const background = '#F4EDE0'

await mkdir('public/icons', { recursive: true })
for (const size of [192, 512]) {
  const artwork = await sharp(source)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
    .resize(Math.round(size * 0.7), Math.round(size * 0.7), {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: artwork, gravity: 'center' }])
    .png()
    .toFile(`public/icons/icon-${size}.png`)
}
console.log('icons written')
