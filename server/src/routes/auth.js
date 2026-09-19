import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db/init.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' })
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (exists) return res.status(409).json({ message: '用户名已存在' })

  const hash = await bcrypt.hash(password, 10)
  const result = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
    .run(username, hash, role === 'admin' ? 'admin' : 'inspector')

  const token = jwt.sign(
    { id: result.lastInsertRowid, username, role: role || 'inspector' },
    JWT_SECRET, { expiresIn: '7d' }
  )
  res.json({ token, username, role: role || 'inspector' })
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: '用户名或密码错误' })
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET, { expiresIn: '7d' }
  )
  res.json({ token, username: user.username, role: user.role })
})

export default router