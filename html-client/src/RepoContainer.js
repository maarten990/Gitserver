import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ListPlaceholder from './ListPlaceholder'
import { apiCall } from './util.js'

const DeleteButton = ({ handleClick }) => (
  <button className="delete-button" onClick={handleClick}>Delete</button>
)

const RepoItem = ({ name, handleDelete }) => (
  <tr className="repo-item">
    <td><Link to={`/repo/${name}`}>{name}</Link></td>
    <td><DeleteButton handleClick={() => handleDelete(name)} /></td>
  </tr>
)

const RepoList = ({ repositories, isLoaded, errorMsg, handleDelete}) => {
  if (isLoaded) {
    return (
      <div className="repo-list">
        <table>
          <tbody>
            {repositories.map((name, i) => <RepoItem name={name} key={i} handleDelete={handleDelete} />)}
          </tbody>
        </table>
        <p className="error-message">{errorMsg}</p>
      </div>
    )
  } else {
    return <ListPlaceholder />
  }
}

const NewRepoForm = ({ handleSubmit, handleChange }) => (
  <div className="new-repo">
    <form onSubmit={handleSubmit}>
      <label>Name: </label>
      <input type='text' onChange={handleChange}/>
      <br />
      <input type='submit' value='Create new repository' className='form-button' />
    </form>
  </div>
)

const createRepo = (event, name, setMsg, setLoaded) => {
  event.preventDefault()
  apiCall('create_repository', { name: name })
    .then(response => response.data.success ? 'Succesfully created repository' : 'Could not create repository')
    .catch(() => 'Could not contact server')
    .then(msg => {
      setMsg(msg)
      setLoaded(false)
    })
}

const deleteRepo = (name, setMsg, setLoaded) => {
  apiCall('delete_repository', { name: name })
    .then(response => response.data.success ? `Deleted repository ${name}` : `Could not delete repository ${name}`)
    .catch(() => 'Could not contact server')
    .then(msg => {
      setMsg(msg)
      setLoaded(false)
    })
}

const RepoContainer = () => {
  const [repositories, setRepositories] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [statusMsg, setStatusMsg] = useState("")
  const [newRepoName, setNewRepoName] = useState("")
  useEffect(
    () => {
      if (loaded) {
        return
      }

      apiCall('get_repositories')
        .then(response => response.data)
        .catch(() => {
          setErrorMsg("Could not get repositories from server.")
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
    <div className="repo-container">
      <h1>Repositories</h1>
      <RepoList repositories={repositories} isLoaded={loaded} errorMsg={errorMsg}
        handleDelete={name => deleteRepo(name, setStatusMsg, setLoaded)} />
      <NewRepoForm
        handleSubmit={
          e => createRepo(e, newRepoName, setStatusMsg, setLoaded)
        }
        handleChange={
          e => {
            const value = e.target.value
            setNewRepoName(value)
          }
        }
      />

      <p className="status-message">{statusMsg}</p>
    </div>
  )
}

export default RepoContainer
