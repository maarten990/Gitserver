import React from 'react'
import ListPlaceholder from './ListPlaceholder'
import { apiCall } from './util.js'

const DiffLine = ({ line }) => {
  let type = ""
  if (line.startsWith("+")) {
    type = "addition"
  } else if (line.startsWith("-")) {
    type = "deletion"
  }

  return (
    <div className={`diff-line ${type}`} >
      {line}
    </div>
  )
}

const DiffItem = ({ diff }) => (
  <div className="diff-item">
    {diff.split("\n").map((line, i) => <DiffLine line={line} key={i} />)}
  </div>
)

const DiffList = ({ diffs, isLoaded }) => {
  if (isLoaded) {
    return (
      <div className="diff-list monospace">
        {diffs.map((diff, i) => <DiffItem diff={diff} key={i} />)}
      </div>
    )
  } else {
    return <ListPlaceholder/>
  }
}

class DiffsContainer extends React.Component {
  state = {
    isLoaded: false,
    diffs: [],
    error: "",
    repoName: this.props.match.params.name,
    sha1: this.props.match.params.sha1,
    shaChanged: true
  }

  getFromRemote() {
    apiCall('get_diffs', { name: this.state.repoName, sha1: this.state.sha1 })
      .then(result => {
        const diffs = (result.data === null) ? [] : result.data
        this.setState((state, props) => {
          return {
            isLoaded: true,
            diffs: diffs,
            shaChanged: false
          }
        })
      })
      .catch(() =>
        this.setState({
          isLoaded: true,
          error: 'Could not reach server or repository/commit does not exist.',
          shaChanged: false
        }))
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const newName = nextProps.match.params.name
    const newSha = nextProps.match.params.sha1

    if (newSha !== prevState.sha1 || newName !== prevState.repoName) {
      return {
        isLoaded: false,
        diffs: [],
        error: "",
        shaChanged: true,
        repoName: newName,
        sha1: newSha
      }
    } else {
      return null
    }
  }

  componentDidMount() {
    this.getFromRemote()
  }

  componentDidUpdate() {
    if (this.state.shaChanged) {
      this.getFromRemote()
    }
  }

  render() {
    return (
      <div className='diffs-container'>
        <h1>Diffs</h1>
        <DiffList diffs={this.state.diffs} isLoaded={this.state.isLoaded} />
        <p className="error-message">{this.state.error}</p>
      </div>
    )
  }
}

export default DiffsContainer