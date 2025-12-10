import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import Greeting from './pages/Greeting'
import Presenting from './pages/Presenting'
import Objections from './pages/Objections'
import Closing from './pages/Closing'
import FollowUp from './pages/FollowUp'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import Unauthorized from './pages/Unauthorized.jsx'
import RequireAuth from './components/RequireAuth.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/greeting" element={<Greeting />} />
          <Route path="/presenting" element={<Presenting />} />
          <Route path="/objections" element={<Objections />} />
          <Route path="/closing" element={<Closing />} />
          <Route path="/followup" element={<FollowUp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
