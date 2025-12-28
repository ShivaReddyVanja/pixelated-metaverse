import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CreatePage from './pages/CreatePage'
import JoinPage from './pages/JoinPage'
import MeetPage from './pages/MeetPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/meet" element={<MeetPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
