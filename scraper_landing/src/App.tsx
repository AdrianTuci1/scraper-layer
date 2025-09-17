import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Pricing } from './pages/Pricing'
import { Documentation } from './pages/Documentation'
import { Resources } from './pages/Resources'
import './i18n'

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col dark bg-gray-900 text-white">
        <Navigation />
        <main className="flex-1 bg-gray-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/resources" element={<Resources />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
