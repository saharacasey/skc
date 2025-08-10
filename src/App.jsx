import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Studio3D from './pages/Studio3DPro'

export default function App(){
  return (
    <Router>
      <header className="header">
        <div className="brand">
          <div className="logo">SW</div>
          <div>
            <div className="brand-title">SustainWISE</div>
            <div className="brand-sub">Studio 3D Pro — Modular, Climate-smart</div>
          </div>
        </div>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/studio" className="btn">Open Studio 3D</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/studio" element={<Studio3D/>} />
      </Routes>
      <footer className="footer">© {new Date().getFullYear()} SustainWISE — Studio 3D Pro</footer>
    </Router>
  )
}
