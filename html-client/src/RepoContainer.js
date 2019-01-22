import React from 'react'
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
      <input type='submit' value='Create new repository' />
    </form>
  </div>
)

class RepoContainer extends React.Component {
  state = {
    // state regarding the repository list
    repositories: [],
    isLoaded: false,
    errorMsg: "",

    // state regarding the "Create new repository" button
    repoName: "",

    // generic message regarding the most recent action
    statusMsg: ""
  }

  successMsg = "Succesfully created repository."
  failMsg = "Could not create repository."

  submitNewRepo = (event) => {
    event.preventDefault()
    apiCall('create_repository', {name: this.state.repoName})
      .then(response => {
        const msg = response.data.success ? this.successMsg : this.failMsg
        this.setState((state, props) => {
          return {statusMsg: msg}
        })

        this.refreshRepositories()
      })
      .catch(() => this.setState((state, props) => {
        return { statusMsg: 'Could not contact server' }
      }))
  }

  newRepoChange = (event) => {
    const value = event.target.value
    this.setState((state, props) => {
      return {
        repoName: value
      }
    })
  }

  refreshRepositories = () => {
    apiCall('get_repositories')
      .then(result => {
        const data = result.data
        this.setState((state, props) => {
          return {
            isLoaded: true,
            repositories: data
          }
        })
      })
      .catch(() => {
        this.setState((state, props) => {
          return {
            isLoaded: true,
            errorMsg: 'Could not get repositories from server.'
          }
        })
      })
  }

  handleDelete = (name) => {
    apiCall('delete_repository', {name: name})
      .then(result => {
        const msg = result.data.success ? `Deleted repository ${name}` : `Could not delete repository ${name}`
        this.setState((state, props) => {
          return {
            statusMsg: msg
          }
        })

        this.refreshRepositories()
      })
      .catch(() => {
        this.setState((state, props) => {
          return {
            statusMsg: 'Could not reach server.'
          }
        })
      })
  }

  componentDidMount() {
    this.refreshRepositories()
  }

  render() {
    return (
      <div className="repo-container">
        <h1>Repositories</h1>
        <RepoList repositories={this.state.repositories} isLoaded={this.state.isLoaded} errorMsg={this.state.errorMsg} handleDelete={this.handleDelete} />
        <NewRepoForm handleSubmit={this.submitNewRepo} handleChange={this.newRepoChange} />
        <p className="status-message">{this.state.statusMsg}</p>
      </div>
    )
  }
}

export default RepoContainer
