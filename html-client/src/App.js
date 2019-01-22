import React from 'react'
import './App.css'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import RepoContainer from './RepoContainer'
import CommitsContainer from './CommitsContainer'

const AppRouter = () => (
  <Router>
    <div className='main-layout'>
      <Route path='/' component={RepoContainer} />
      <Route path='/repo/:name' component={CommitsContainer} />
    </div>
  </Router>
)

export default AppRouter
