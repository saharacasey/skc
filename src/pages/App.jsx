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
      <header>
        <nav>
          <Link to="/">Home</Link> | <Link to="/features">Features</Link> | 
          <Link to="/roadmap">Roadmap</Link> | <Link to="/demo">Demo</Link> | 
          <Link to="/contact">Contact</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Router>
  )
}
