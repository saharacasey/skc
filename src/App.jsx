import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import FeaturesPage from './pages/FeaturesPage'
import RoadmapPage from './pages/RoadmapPage'
import DemoPage from './pages/DemoPage'
import ContactPage from './pages/ContactPage'

export default function App(){
  return (
    <Router>
      <div className="min-h-screen">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md" style={{background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>SD</div>
              <div>
                <h1 className="text-sm font-semibold">Sustainable Design Lab</h1>
                <p className="text-xs text-slate-500">Concept → Simulation → Circular Construction</p>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <Link className="text-sm" to="/features">Features</Link>
              <Link className="text-sm" to="/roadmap">Roadmap</Link>
              <Link className="text-sm" to="/demo">Demo</Link>
              <Link className="text-sm btn" to="/contact">Contact</Link>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>

        <footer className="mt-12" style={{textAlign:'center',fontSize:'.875rem',color:'#64748b'}}>
          © {new Date().getFullYear()} Sustainable Design Lab — Client-side prototype
        </footer>
      </div>
    </Router>
  )
}
