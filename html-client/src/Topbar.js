import React from 'react'
import { Classes, InputGroup, Navbar, Switch } from "@blueprintjs/core";
import RepoPopover from './RepoPopover'
import { connect } from 'react-redux'
import { toggleDarkMode } from './redux/actions'

const Topbar = ({ match, darkMode, toggleDarkMode }) => {
  let contents = null
  const name = match.params.name
  if (name) {
    const hostname = window.location.hostname
    contents = (
      <>
        <Navbar.Divider />
        <Navbar.Heading>Repository: {match.params.name}</Navbar.Heading>
        <Navbar.Heading>Clone url: </Navbar.Heading>
        <InputGroup value={`git@${hostname}:${name}`} intent='primary' readOnly={true} />
      </>
    )
  }

  return (
    <Navbar className={`repo-container ${Classes.ELEVATION_2}`}>
      <Navbar.Group align='left'>
        <RepoPopover />
      </Navbar.Group>
      <Navbar.Group>
        {contents}
      </Navbar.Group>
      <Navbar.Group align='right'>
        <Switch label='Dark mode' checked={darkMode} onChange={() => toggleDarkMode()} />
      </Navbar.Group>
    </Navbar>
  )
}

const mapStateToProps = state => {
  return {
    darkMode: state.shared.darkMode
  }
}

const mapDispatchToProps = {
  toggleDarkMode
}

export default connect(mapStateToProps, mapDispatchToProps)(Topbar)