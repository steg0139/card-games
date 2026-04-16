import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import gameRoutes from './routes/games'
import userRoutes from './routes/users'

const app = express()

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/games', gameRoutes)
app.use('/api/users', userRoutes)

export default app
