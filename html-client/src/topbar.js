import React, { useState, useEffect } from 'react'
import { Classes, InputGroup, Navbar } from "@blueprintjs/core";

const Topbar = ({ match }) => {
  let contents = null
  const name = match.params.name
  if (name) {
    const hostname = window.location.hostname
    contents = (
      <>
        <Navbar.Divider />
        <Navbar.Heading>Repository: {match.params.name}</Navbar.Heading>
        <Navbar.Heading>Clone url: </Navbar.Heading>
        <InputGroup value={`git@${hostname}:${name}`} intent='primary' />
      </>
    )
  }

  return (
    <Navbar className={`repo-container ${Classes.ELEVATION_2}`}>
      <Navbar.Group>
        {contents}
      </Navbar.Group>
    </Navbar>
  )
}

export default Topbar