import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db/init.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' })

  const existsResult = await db.execute({
    sql: 'SELECT id FROM users WHERE username = ?',
    args: [username]
  })
  if (existsResult.rows.length > 0) return res.status(409).json({ message: '用户名已存在' })

  const hash = await bcrypt.hash(password, 10)
  const insertResult = await db.execute({
    sql: 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    args: [username, hash, role === 'admin' ? 'admin' : 'inspector']
  })

  const id = Number(insertResult.lastInsertRowid)
  const token = jwt.sign(
    { id, username, role: role || 'inspector' },
    JWT_SECRET, { expiresIn: '7d' }
  )
  res.json({ token, username, role: role || 'inspector' })
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE username = ?',
    args: [username]
  })
  const user = result.rows[0]
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