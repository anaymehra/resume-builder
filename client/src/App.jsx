import React from 'react'
import LandingPage from './components/LandingPage'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import Auth from './components/Auth'
import Home from './components/Home'
import NotFound from './components/NotFound'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<LandingPage/>}/>
        <Route path='/auth' element={<Auth />}/>
        <Route path='/home' element={<Home />}/>
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App
