import { Router } from 'express'
import db from '../db/init.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// 列表（支持筛选/搜索/分页）
router.get('/', (req, res) => {
  const page = Number(req.query.page) || 1
  const size = Number(req.query.size) || 10
  const { keyword, type, status, startDate, endDate } = req.query
  const offset = (page - 1) * size

  const conditions = []
  const params = []
  if (keyword) { conditions.push('(title LIKE ? OR address LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`) }
  if (type) { conditions.push('type = ?'); params.push(type) }
  if (status) { conditions.push('status = ?'); params.push(status) }
  // 新增： 时间范围
  if (startDate) {
    conditions.push('date(e.created_at) >= date(?)')
    params.push(startDate)
  }
  if (endDate) {
    conditions.push('date(e.created_at) <= date(?)')
    params.push(endDate)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const total = db.prepare(`SELECT COUNT(*) AS count FROM events e ${where}`).get(...params).count
  const list = db.prepare(`
    SELECT e.*, u.username AS reporter_name
    FROM events e LEFT JOIN users u ON e.reporter_id = u.id
    ${where} ORDER BY e.id DESC LIMIT ? OFFSET ?
  `).all(...params, size, offset)

  // 解析 images JSON
  const parsed = list.map(row => ({ ...row, images: JSON.parse(row.images || '[]') }))
  res.json({ list: parsed, total, page, size })
})

// 详情
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT e.*, u.username AS reporter_name
    FROM events e LEFT JOIN users u ON e.reporter_id = u.id WHERE e.id = ?
  `).get(req.params.id)
  if (!row) return res.status(404).json({ message: '事件不存在' })
  res.json({ ...row, images: JSON.parse(row.images || '[]') })
})

// 新建
router.post('/', (req, res) => {
  const { title, description, type, images, latitude, longitude, address } = req.body
  if (!title) return res.status(400).json({ message: '标题不能为空' })
  const result = db.prepare(`
    INSERT INTO events (title, description, type, images, latitude, longitude, address, reporter_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, description || '', type || 'other', JSON.stringify(images || []),
         latitude || null, longitude || null, address || '', req.user.id)
  res.status(201).json({ id: result.lastInsertRowid })
})

// 编辑
router.put('/:id', (req, res) => {
  const { title, description, type, images, latitude, longitude, address } = req.body
  db.prepare(`
    UPDATE events SET title=?, description=?, type=?, images=?, latitude=?, longitude=?,
    address=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(title, description, type, JSON.stringify(images || []),
         latitude, longitude, address, req.params.id)
  res.json({ message: '更新成功' })
})

// 变更状态（巡检员只能改自己的，管理员可改全部）
router.patch('/:id/status', (req, res) => {
  const { status, handler_note } = req.body
  const valid = ['pending', 'processing', 'done']
  if (!valid.includes(status)) return res.status(400).json({ message: '状态值无效' })

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
  if (!event) return res.status(404).json({ message: '事件不存在' })
  if (req.user.role !== 'admin' && event.reporter_id !== req.user.id) {
    return res.status(403).json({ message: '无权操作此事件' })
  }

  db.prepare('UPDATE events SET status=?, handler_note=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status, handler_note || '', req.params.id)
  res.json({ message: '状态已更新' })
})

// 删除（仅管理员）
router.delete('/:id', adminOnly, (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id)
  res.json({ message: '删除成功' })
})

// 驾驶舱统计数据
router.get('/stats/overview', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS c FROM events').get().c
  const pending = db.prepare("SELECT COUNT(*) AS c FROM events WHERE status='pending'").get().c
  const today = db.prepare("SELECT COUNT(*) AS c FROM events WHERE date(created_at)=date('now')").get().c

  // 近 7 天趋势
  const trend = db.prepare(`
    SELECT date(created_at) AS date, COUNT(*) AS count
    FROM events WHERE created_at >= date('now', '-7 days')
    GROUP BY date(created_at) ORDER BY date
  `).all()

  // 类型分布
  const typeDist = db.prepare('SELECT type, COUNT(*) AS count FROM events GROUP BY type').all()

  // 状态分布
  const statusDist = db.prepare('SELECT status, COUNT(*) AS count FROM events GROUP BY status').all()

  res.json({ total, pending, today, trend, typeDist, statusDist })
})

// 地图打点数据
router.get('/map/points', (req, res) => {
  const points = db.prepare(`
    SELECT id, title, type, status, latitude AS lat, longitude AS lng, address
    FROM events WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `).all()
  res.json(points)
})

export default router