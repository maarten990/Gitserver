import React from 'react'
import './App.css'
import './theme.css'
import '../node_modules/highlight.js/styles/dracula.css'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import RepoContainer from './RepoContainer'
import CommitsContainer from './CommitsContainer'
import DiffsContainer from './DiffsContainer'
import FileViewContainer from './FileViewContainer'

const App = () => (
  <Router>
    <div className='main-layout'>
      <Route path='/' component={RepoContainer} />
      <div className='middle-column'>
        <Route path='/repo/:name' render={({ match }) => <CommitsContainer name={match.params.name} />} />
        <Route path='/repo/:name/:sha1'
          render={({ match }) => <DiffsContainer name={match.params.name} sha1={match.params.sha1} />} />
      </div>
      <Route path='/repo/:name/:sha1'
        render={({ match }) => <FileViewContainer name={match.params.name} sha1={match.params.sha1} />} />
    </div>
  </Router>
)

export default App
