import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ListPlaceholder from './ListPlaceholder'
import { apiCall, usePrevious } from './util.js'

const Commit = ({ repoName, message, sha1 }) => (
  <>
    <tr>
      <td className='commit-message monospace'>
        <Link to={`/repo/${repoName}/${sha1}`}>{message}</Link>
      </td>
    </tr>
    <tr>
      <td className="commit-hash">
        {sha1}
      </td>
    </tr>
  </>
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

const getCommits = (name, setCommits, setLoaded) => {
  apiCall('get_commits', { name: name })
    .then(response => response.data)
    .catch(() => [])
    .then(commits => {
      setCommits(commits)
      setLoaded(true)
    })
}

const CommitsContainer = ({ name }) => {
  const [loaded, setLoaded] = useState(false)
  const [commits, setCommits] = useState([])
  const prevRepoName = usePrevious(name);

  useEffect(() => {
    if (prevRepoName !== name) {
      setLoaded(false)
    }
  }, [name])

  useEffect(() => {
    if (loaded) {
      return
    }

    getCommits(name, setCommits, setLoaded)
  }, [loaded])

  return (
    <div className="commits-container">
      <h1>Commits</h1>
      <CommitList
        repoName={name}
        commits={commits}
        isLoaded={loaded} />
    </div>
  )
}

export default CommitsContainer