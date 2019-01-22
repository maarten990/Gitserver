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
          {messages.map((msg, i) => <Commit message={msg} id={i} />)}
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
    error: ""
  }

  getFromRemote() {
    // the repo name as passed by react-router
    const repoName = this.props.match.params.name

    apiCall('get_commits', {name: repoName})
      .then(result => {
        const messages = (result.data === null) ? [] : result.data
        this.setState((state, props) => {
          return {
            isLoaded: true,
            messages: messages
          }
        })
      })
      .catch(() =>
        this.setState({
          isLoaded: true,
          error: 'Could not reach server.'
        }))
  }

  componentDidMount() {
    this.getFromRemote()
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