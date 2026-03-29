import { Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Auth from '@/pages/Auth'
import GameSetup from '@/pages/GameSetup'
import GamePlay from '@/pages/GamePlay'
import Results from '@/pages/Results'
import History from '@/pages/History'
import GameDetail from '@/pages/GameDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/setup/:gameId" element={<GameSetup />} />
      <Route path="/game" element={<GamePlay />} />
      <Route path="/results" element={<Results />} />
      <Route path="/history" element={<History />} />
      <Route path="/history/:gameId" element={<GameDetail />} />
    </Routes>
  )
}
