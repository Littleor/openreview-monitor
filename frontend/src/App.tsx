import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Admin from './pages/Admin'
import { Toaster } from './components/ui/toaster'
import { SeoManager } from './components/SeoManager'

function App() {
  return (
    <Router>
      <SeoManager />
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App
