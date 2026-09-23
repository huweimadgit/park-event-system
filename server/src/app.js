import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import eventsRouter from './routes/events.js'
import uploadRouter from './routes/upload.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/events', eventsRouter)
app.use('/api/upload', uploadRouter)

// ... 上面是你的路由和中间件代码 ...

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.get('/api/proxy-image', async (req, res) => {
  const url = req.query.url
  if (!url) return res.status(400).send('missing url')
  try {
    const r = await fetch(url)
    const buf = Buffer.from(await r.arrayBuffer())
    res.set('Content-Type', r.headers.get('content-type') || 'image/jpeg')
    res.send(buf)
  } catch (err) {
    console.error('proxy error:', err)
    res.status(500).send('proxy error')
  }
})

// 关键：启动服务器并监听 Railway 注入的端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
export default app