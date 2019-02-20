import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Classes, FormGroup, InputGroup, Spinner, Toaster, Popover, Navbar } from "@blueprintjs/core";
import { apiCall } from './util.js'

const toaster = Toaster.create()

const DeleteButton = ({ handleClick, visible }) => (
  <Button intent='danger' text='' onClick={handleClick} icon='trash' minimal small disabled={!visible} />
)

const RepoItem = ({ name, handleDelete, deleteVisible }) => (
  <>
    <DeleteButton className='delete-button' handleClick={() => handleDelete(name)} visible={deleteVisible} />
    <p className='repo-name'><Link to={`/repo/${name}`}>{name}</Link></p>
  </>
)

const RepoList = ({ repositories, isLoaded, handleDelete, deleteVisible}) => {
  if (isLoaded) {
    return (
      <div className="repo-list">
        {repositories.map((name, i) => <RepoItem name={name} key={i} handleDelete={handleDelete} deleteVisible={deleteVisible} />)}
      </div>
    )
  } else {
    return <Spinner intent='primary' />
  }
}

const NewRepoForm = ({ handleSubmit, handleChange, handleDelete, deleteVisible }) => (
  <div className="new-repo">
    <form onSubmit={handleSubmit}>
      <FormGroup
        helperText='Create a new repository'
        labelFor='name-input'
      >
        <InputGroup id='name-input' placeholder='Repository name' onChange={handleChange} />
        <Button type='submit' text='Create' intent='primary' />
      </FormGroup>
    </form>
    <Button text={deleteVisible ? 'Cancel' : 'Delete a repository'} intent='warning' onClick={handleDelete} />
  </div>
)

const createRepo = (name, toaster, setLoaded) => {
  apiCall('create_repository', { name: name })
    .then(response => {
      const msg = response.data.success ? 'Succesfully created repository' : 'Could not create repository'
      const intent = response.data.success ? 'success' : 'danger'
      return [msg, intent]
    })
    .catch(() => ['Could not contact server', 'danger'])
    .then(([msg, intent]) => {
      toaster.show({message: msg, intent: intent})
      setLoaded(false)
    })
}

const deleteRepo = (name, toaster, setLoaded) => {
  apiCall('delete_repository', { name: name })
    .then(response => {
      const msg = response.data.success ? `Deleted repository ${name}` : `Could not delete repository ${name}`
      const intent = response.data.success ? 'success' : 'danger'
      return [msg, intent]
    })
    .catch(() => ['Could not contact server', 'danger'])
    .then(([msg, intent]) => {
      toaster.show({message: msg, intent: intent})
      setLoaded(false)
    })
}

const RepoPopover = () => {
  const [repositories, setRepositories] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [newRepoName, setNewRepoName] = useState("")
  const [deleteVisible, setDeleteVisible] = useState(false)

  useEffect(
    () => {
      if (loaded) {
        return
      }

      apiCall('get_repositories')
        .then(response => response.data)
        .catch(() => {
          toaster.show({ message: 'Could not get repositories from server', intent: 'danger' })
          return []
        })
        .then(repositories => {
          setRepositories(repositories)
          setLoaded(true)
        })
    },
    [loaded],
  )

  return (
    <div className='popover'>
      <RepoList repositories={repositories} isLoaded={loaded} deleteVisible={deleteVisible}
        handleDelete={name => {
          deleteRepo(name, toaster, setLoaded)
          setDeleteVisible(false)
        }} />
      <NewRepoForm
        handleSubmit={e => {
          e.preventDefault()
          createRepo(newRepoName, toaster, setLoaded)
        }}
        handleChange={e => {
            const value = e.target.value
            setNewRepoName(value)
        }}
        handleDelete={() => setDeleteVisible(!deleteVisible)}
        deleteVisible={deleteVisible}
      />
    </div>
  )
}

const RepoContainer = ({ match }) => {
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
        <Popover
          content={<RepoPopover />}
          target={<Button className='popover-button' text='Load repository' intent='primary' />} />
        {contents}
      </Navbar.Group>
    </Navbar>
  )
}

export default RepoContainer
