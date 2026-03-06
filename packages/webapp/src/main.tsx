import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Register from './pages/Register'
import Verify from './pages/Verify'
import App from './pages/App'
import Install from './pages/Install'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/app" element={<App />} />
        <Route path="/install" element={<Install />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
