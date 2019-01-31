import React from 'react'
import { Link } from 'react-router-dom'
import ListPlaceholder from './ListPlaceholder'
import { apiCall } from './util.js'

const Commit = ({ repoName, message, sha1 }) => (
  <tr className='commit'>
    <td className='commit-message'>
      <Link to={`/repo/${repoName}/${sha1}`}>{message}</Link>
    </td>
    <td className="commit-hash">
      {sha1}
    </td>
  </tr>
)

const CommitList = ({ repoName, commits, isLoaded }) => {
  if (isLoaded) {
    return (
      <table className="commit-list">
        <tbody>
          {commits.map((c, i) => <Commit repoName={repoName} message={c.message} sha1={c.sha1} key={i} />)}
        </tbody>
      </table>
    )
  } else {
    return (
      <ListPlaceholder />
    )
  }
}

class CommitsContainer extends React.Component {
  state = {
    isLoaded: false,
    commits: [],
    error: "",
    repoName: this.props.match.params.name,
    nameChanged: true
  }

  getFromRemote() {
    apiCall('get_commits', {name: this.state.repoName})
      .then(result => {
        const commits = (result.data === null) ? [] : result.data
        this.setState((state, props) => {
          return {
            isLoaded: true,
            commits: commits,
            nameChanged: false
          }
        })
      })
      .catch(() =>
        this.setState({
          isLoaded: true,
          error: 'No commits to display.',
          nameChanged: false
        }))
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const newName = nextProps.match.params.name

    if (newName !== prevState.repoName) {
      return {
        isLoaded: false,
        commits: [],
        error: "",
        nameChanged: true,
        repoName: newName
      }
    } else {
      return null
    }
  }

  componentDidMount() {
    this.getFromRemote()
  }

  componentDidUpdate() {
    if (this.state.nameChanged) {
      this.getFromRemote()
    }
  }

  render() {
    return (
      <div className="commits-container">
        <h1>Commits</h1>
        <CommitList
          repoName={this.state.repoName}
          commits={this.state.commits}
          isLoaded={this.state.isLoaded} />
        <p className="error-message">{this.state.error}</p>
      </div>
    )
  }
}

export default CommitsContainer