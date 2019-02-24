import React from 'react'
import 'normalize.css/normalize.css'
import '@blueprintjs/core/lib/css/blueprint.css'
import './App.css'
import './atom-one-light.css'
import './atom-one-dark.css'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import { connect, Provider } from 'react-redux'
import store from './redux/store'
import CommitsContainer from './CommitsContainer'
import DiffsContainer from './DiffsContainer'
import DirListing from './DirListing'
import Topbar from './Topbar'

const mapPropsToState = state => {
  return {
    darkMode: state.shared.darkMode
  }
}

let ConnectedApp = ({ darkMode }) => (
    <Router>
      <div className={`main-layout ${darkMode ? 'bp3-dark' : ''}`}>
        <Route path='/(repo)?/:name?' component={Topbar} />
        <Route path='/repo/:name/:sha1?'
          render={({ match }) => <CommitsContainer name={match.params.name} sha1={match.params.sha1} />} />
        <Route path='/repo/:name/:sha1'
          render={({ match }) => <DiffsContainer name={match.params.name} sha1={match.params.sha1} />} />
        <Route path='/repo/:name/:sha1'
          render={({ match }) => <DirListing name={match.params.name} sha1={match.params.sha1} />} />
      </div>
    </Router>
)

ConnectedApp = connect(mapPropsToState, {})(ConnectedApp)

const App = () => (
  <Provider store={store}>
    <ConnectedApp />
  </Provider>
)

export default App
