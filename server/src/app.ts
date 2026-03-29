import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import gameRoutes from './routes/games.js'

const app = express()

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/games', gameRoutes)

export default app
