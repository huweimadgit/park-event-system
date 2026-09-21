import { Router } from 'express'
import multer from 'multer'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  },
  forcePathStyle: true
})

// 用内存存储，不写到磁盘
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('仅支持 jpg/png/webp 格式'))
  }
})

router.post('/', authMiddleware, upload.array('images', 3), async (req, res) => {
  try {
    const files = req.files || []
    if (files.length === 0) return res.status(400).json({ message: '请上传图片' })

    const uploadedUrls = []

    for (const file of files) {
      const ext = file.originalname.split('.').pop()
      const key = `events/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      }))

      // 公开访问 URL
      const publicUrl = `${process.env.B2_PUBLIC_URL_BASE}/${key}`
      uploadedUrls.push(publicUrl)
    }

    res.json({ files: uploadedUrls })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ message: '上传失败' })
  }
})

export default router