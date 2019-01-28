import React from 'react'
import './App.css'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import RepoContainer from './RepoContainer'
import CommitsContainer from './CommitsContainer'
import DiffsContainer from './DiffsContainer'

class AppRouter extends React.Component {
  render() {
    return (
      <Router>
        <div className='main-layout'>
          <Route path='/' component={RepoContainer} />
          <Route path='/repo/:name' component={CommitsContainer} />
          <Route path='/repo/:name/:sha1' component={DiffsContainer} />
        </div>
      </Router>
    )
  }
}

export default AppRouter
