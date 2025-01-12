import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Dashboard from './Components/Dashboard'
import LearningPath from './Components/learningPath'
import MockInterview from './Components/mockinterview'
import PortfolioBuilder from './Components/portfolioBuilder'
import Redeem from './Components/redeem'
import Navbar from './Components/navbar'
import './App.css'

function App() {

  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/learning-path" element={<LearningPath />} />
          <Route path="/mock-interview" element={<MockInterview />} />
          <Route path="/portfolio-builder" element={<PortfolioBuilder />} />
          <Route path="/redeem" element={<Redeem />} />
        </Routes>
      </div>
    </Router>

  )
}

export default App
