import React from 'react'
import ListPlaceholder from './ListPlaceholder'
import { apiCall } from './util.js'

const Commit = ({ message }) => (
  <tr className="commit">
    <td className="commit-message">
      {message}
    </td>
    <td className="commit-hash">
      "placeholder_hash"
    </td>
  </tr>
)

const CommitList = ({ messages, isLoaded }) => {
  if (isLoaded) {
    return (
      <table className="commit-list">
        <tbody>
          {messages.map((msg, i) => <Commit message={msg} key={i} />)}
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
    messages: [],
    error: "",
    repoName: this.props.match.params.name,
    nameChanged: true
  }

  getFromRemote() {
    apiCall('get_commits', {name: this.state.repoName})
      .then(result => {
        const messages = (result.data === null) ? [] : result.data
        this.setState((state, props) => {
          return {
            isLoaded: true,
            messages: messages,
            nameChanged: false
          }
        })
      })
      .catch(() =>
        this.setState({
          isLoaded: true,
          error: 'Could not reach server or repository does not exist.',
          nameChanged: false
        }))
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const newName = nextProps.match.params.name

    if (newName !== prevState.repoName) {
      return {
        isLoaded: false,
        messages: [],
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
        <CommitList messages={this.state.messages} isLoaded={this.state.isLoaded} />
        <p className="error-message">{this.state.error}</p>
      </div>
    )
  }
}

export default CommitsContainer