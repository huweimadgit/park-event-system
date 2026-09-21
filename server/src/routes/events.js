import { Router } from 'express'
import db from '../db/init.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// 列表（筛选/搜索/分页）
router.get('/', async (req, res) => {
  const page = Number(req.query.page) || 1
  const size = Number(req.query.size) || 10
  const { keyword, type, status, startDate, endDate } = req.query
  const offset = (page - 1) * size

  const conditions = []
  const params = []
  if (keyword) {
    conditions.push('(e.title LIKE ? OR e.address LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  if (type) { conditions.push('e.type = ?'); params.push(type) }
  if (status) { conditions.push('e.status = ?'); params.push(status) }
  if (startDate) { conditions.push('date(e.created_at) >= date(?)'); params.push(startDate) }
  if (endDate) { conditions.push('date(e.created_at) <= date(?)'); params.push(endDate) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) AS count FROM events e ${where}`,
    args: params
  })
  const total = Number(countResult.rows[0].count)

  const listResult = await db.execute({
    sql: `SELECT e.*, u.username AS reporter_name
      FROM events e LEFT JOIN users u ON e.reporter_id = u.id
      ${where} ORDER BY e.id DESC LIMIT ? OFFSET ?`,
    args: [...params, size, offset]
  })

  const parsed = listResult.rows.map(row => ({
    ...row,
    images: JSON.parse(row.images || '[]')
  }))
  res.json({ list: parsed, total, page, size })
})

// 详情
router.get('/:id', async (req, res) => {
  const result = await db.execute({
    sql: `SELECT e.*, u.username AS reporter_name
      FROM events e LEFT JOIN users u ON e.reporter_id = u.id
      WHERE e.id = ?`,
    args: [req.params.id]
  })
  const row = result.rows[0]
  if (!row) return res.status(404).json({ message: '事件不存在' })
  res.json({ ...row, images: JSON.parse(row.images || '[]') })
})

// 新建
router.post('/', async (req, res) => {
  const { title, description, type, images, latitude, longitude, address } = req.body
  if (!title) return res.status(400).json({ message: '标题不能为空' })

  const result = await db.execute({
    sql: `INSERT INTO events (title, description, type, images, latitude, longitude, address, reporter_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      title,
      description || '',
      type || 'other',
      JSON.stringify(images || []),
      latitude || null,
      longitude || null,
      address || '',
      req.user.id
    ]
  })

  res.status(201).json({ id: Number(result.lastInsertRowid) })
})

// 编辑
router.put('/:id', async (req, res) => {
  const { title, description, type, images, latitude, longitude, address } = req.body

  await db.execute({
    sql: `UPDATE events SET title=?, description=?, type=?, images=?,
      latitude=?, longitude=?, address=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?`,
    args: [
      title,
      description,
      type,
      JSON.stringify(images || []),
      latitude,
      longitude,
      address,
      req.params.id
    ]
  })

  res.json({ message: '更新成功' })
})

// 变更状态
router.patch('/:id/status', async (req, res) => {
  const { status, handler_note } = req.body
  const valid = ['pending', 'processing', 'done']
  if (!valid.includes(status)) return res.status(400).json({ message: '状态值无效' })

  const eventResult = await db.execute({
    sql: 'SELECT * FROM events WHERE id = ?',
    args: [req.params.id]
  })
  const event = eventResult.rows[0]
  if (!event) return res.status(404).json({ message: '事件不存在' })

  if (req.user.role !== 'admin' && Number(event.reporter_id) !== Number(req.user.id)) {
    return res.status(403).json({ message: '无权操作此事件' })
  }

  await db.execute({
    sql: 'UPDATE events SET status=?, handler_note=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    args: [status, handler_note || '', req.params.id]
  })

  res.json({ message: '状态已更新' })
})

// 删除（仅管理员）
router.delete('/:id', adminOnly, async (req, res) => {
  await db.execute({
    sql: 'DELETE FROM events WHERE id = ?',
    args: [req.params.id]
  })
  res.json({ message: '删除成功' })
})

// 驾驶舱统计
router.get('/stats/overview', async (req, res) => {
  const totalR = await db.execute('SELECT COUNT(*) AS c FROM events')
  const pendingR = await db.execute("SELECT COUNT(*) AS c FROM events WHERE status='pending'")
  const todayR = await db.execute("SELECT COUNT(*) AS c FROM events WHERE date(created_at)=date('now')")
  const trendR = await db.execute(
    "SELECT date(created_at) AS date, COUNT(*) AS count FROM events GROUP BY date(created_at) ORDER BY date DESC LIMIT 7"
  )
  const typeR = await db.execute('SELECT type, COUNT(*) AS count FROM events GROUP BY type')
  const statusR = await db.execute('SELECT status, COUNT(*) AS count FROM events GROUP BY status')

  res.json({
    total: Number(totalR.rows[0].c),
    pending: Number(pendingR.rows[0].c),
    today: Number(todayR.rows[0].c),
    trend: trendR.rows.reverse(),
    typeDist: typeR.rows,
    statusDist: statusR.rows
  })
})

// 地图打点
router.get('/map/points', async (req, res) => {
  const result = await db.execute(
    'SELECT id, title, type, status, latitude AS lat, longitude AS lng, address FROM events WHERE latitude IS NOT NULL AND longitude IS NOT NULL'
  )
  res.json(result.rows)
})

export default router