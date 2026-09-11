import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { randomBytes } from 'node:crypto'

function safeExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  const raw = dot >= 0 ? filename.slice(dot + 1) : ''
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
}

function safeRandom(value: string): string {
  const clean = value.toLowerCase().replace(/[^a-z0-9]/g, '')
  return clean || randomBytes(3).toString('hex')
}

export function objectKeyFor(
  date: string | null,
  filename: string,
  now: Date = new Date(),
  rand = randomBytes(3).toString('hex'),
): string {
  const folder = date ? `entries/${date}` : 'misc'
  return `${folder}/${now.getTime()}-${safeRandom(rand)}.${safeExtension(filename)}`
}

let client: S3Client | undefined
let clientConfigKey = ''

function useS3(): { client: S3Client; cfg: ReturnType<typeof useRuntimeConfig>['s3'] } {
  const cfg = useRuntimeConfig().s3
  if (!cfg.bucket || !cfg.accessKeyId || !cfg.secretAccessKey || !cfg.publicBaseUrl) {
    throw createError({ statusCode: 503, statusMessage: '尚未設定圖片儲存空間' })
  }

  const key = [cfg.endpoint, cfg.region, cfg.bucket, cfg.accessKeyId].join('|')
  if (!client || clientConfigKey !== key) {
    client = new S3Client({
      region: cfg.region || 'auto',
      endpoint: cfg.endpoint || undefined,
      forcePathStyle: Boolean(cfg.endpoint),
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    })
    clientConfigKey = key
  }
  return { client, cfg }
}

export async function uploadImage(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const { client: s3, cfg } = useS3()
  await s3.send(new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
  return `${cfg.publicBaseUrl.replace(/\/$/, '')}/${key}`
}
