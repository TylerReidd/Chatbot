import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import Greeting from './pages/Greeting'
import Presenting from './pages/Presenting'
import Objections from './pages/Objections'
import Closing from './pages/Closing'
import FollowUp from './pages/FollowUp'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/greeting" element={<Greeting />} />
        <Route path="/presenting" element={<Presenting />} />
        <Route path="/objections" element={<Objections />} />
        <Route path="/closing" element={<Closing />} />
        <Route path="/followup" element={<FollowUp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
