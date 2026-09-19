import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// 确保上传目录存在
const uploadDir = 'uploads'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // 用时间戳 + 随机数避免文件名冲突
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 单文件最大 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('仅支持 jpg/png/webp 格式'))
  }
})

// 多图上传，字段名 images，最多 3 张
router.post('/', authMiddleware, upload.array('images', 3), (req, res) => {
  const files = (req.files || []).map(f => `/uploads/${f.filename}`)
  res.json({ files })
})

export default router