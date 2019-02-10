import React from 'react'
import './App.css'
import './theme.css'
import '../node_modules/highlight.js/styles/dracula.css'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import RepoContainer from './RepoContainer'
import CommitsContainer from './CommitsContainer'
import DiffsContainer from './DiffsContainer'
import DirListing from './DirListing'
import FileView from './FileView'

const MainPage = () => (
  <>
    <Route path='/' component={RepoContainer} />
    <div className='middle-column'>
      <Route path='/repo/:name' render={({ match }) => <CommitsContainer name={match.params.name} />} />
      <Route path='/repo/:name/:sha1'
        render={({ match }) => <DiffsContainer name={match.params.name} sha1={match.params.sha1} />} />
    </div>
    <Route path='/repo/:name/:sha1'
      render={({ match }) => <DirListing name={match.params.name} sha1={match.params.sha1} />} />
  </>
)

const App = () => (
  <div className='main-layout'>
    <Router>
      <Switch>
        <Route path='/repo/:name/:sha1/:path+'
          render={({ match }) => <FileView name={match.params.name} sha1={match.params.sha1} path={match.params.path} /> } />
        <Route path='/' component={MainPage} />
    </Switch>
  </Router>
  </div>
)

export default App
