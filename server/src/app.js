import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.js'
import eventsRouter from './routes/events.js'
import uploadRouter from './routes/upload.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))  // 图片静态访问

app.use('/api/auth', authRouter)
app.use('/api/events', eventsRouter)
app.use('/api/upload', uploadRouter)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running at http://localhost:${PORT}`)
})