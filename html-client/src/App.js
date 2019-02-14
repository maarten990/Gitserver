import React from 'react'
import 'normalize.css/normalize.css'
import '@blueprintjs/core/lib/css/blueprint.css'
import './App.css'
import './theme.css'
import 'highlight.js/styles/default.css'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import RepoContainer from './RepoContainer'
import CommitsContainer from './CommitsContainer'
import DiffsContainer from './DiffsContainer'
import DirListing from './DirListing'

const App = () => (
  <Router>
    <div className='main-layout'>
      <Route path='/' component={RepoContainer} />
      <Route path='/repo/:name'
        render={({ match }) => <CommitsContainer name={match.params.name} />} />
      <Route path='/repo/:name/:sha1'
        render={({ match }) => <DiffsContainer name={match.params.name} sha1={match.params.sha1} />} />
      <Route path='/repo/:name/:sha1'
        render={({ match }) => <DirListing name={match.params.name} sha1={match.params.sha1} />} />
    </div>
  </Router>
)

export default App
