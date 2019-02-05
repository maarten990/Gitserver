import React from 'react'
import './App.css'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import RepoContainer from './RepoContainer'
import CommitsContainer from './CommitsContainer'
import DiffsContainer from './DiffsContainer'
import FileViewContainer from './FileViewContainer'

const App = () => (
  <Router>
    <div className='main-layout'>
      <div className='ui-row'>
        <Route path='/' component={RepoContainer} />
        <Route path='/repo/:name' component={CommitsContainer} />
        <Route path='/repo/:name/:sha1' component={DiffsContainer} />
      </div>
      <div className='bottom-row'>
        <Route path='/repo/:name/:sha1' component={FileViewContainer} />
      </div>
    </div>
  </Router>
)

export default App
