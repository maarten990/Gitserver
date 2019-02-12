import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUndo } from '@fortawesome/free-solid-svg-icons'
import ListPlaceholder from './ListPlaceholder'
import { apiCall, usePrevious } from './util.js'

const MessageView = ({ message, onClose }) => (
  <div className='message-view'>
    <button onClick={onClose}>
      <FontAwesomeIcon icon={faUndo} />
    </button>
    {message.split(/\n/).map((line, i) => <p className='monospace' key={i}>{line}</p>)}
  </div>
)

const Commit = ({ repoName, summary, body, sha1, onClick }) => (
  <>
    <tr>
      <td className='commit-message monospace'>
        <Link to={`/repo/${repoName}/${sha1}`} onClick={e => {onClick(summary, body)}}>{summary}</Link>
      </td>
    </tr>
    <tr>
      <td className="commit-hash">
        {sha1}
      </td>
    </tr>
  </>
)

const CommitList = ({ repoName, commits, isLoaded, onClick }) => {
  if (isLoaded) {
    return (
      <table className="commit-list">
        <tbody>
          {commits.map((c, i) => <Commit repoName={repoName} summary={c.summary} body={c.body} sha1={c.sha1} onClick={onClick} key={i} />)}
        </tbody>
      </table>
    )
  } else {
    return (
      <ListPlaceholder />
    )
  }
}

// convert a commit's message to an object with a summary and a body
const summarizeCommit = ({ message, sha1 }) => {
  let lines = message.split(/\n/)
  return {
    summary: lines[0],
    body: lines.slice(1).join('\n'),
    sha1: sha1
  }
}

const getCommits = (name, setCommits, setLoaded) => {
  apiCall('get_commits', { name: name })
    .then(response => response.data)
    .catch(() => [])
    .then(commits => {
      setCommits(commits.map(summarizeCommit))
      setLoaded(true)
    })
}

const CommitsContainer = ({ name }) => {
  const [loaded, setLoaded] = useState(false)
  const [commits, setCommits] = useState([])
  const [activeCommit, setActiveCommit] = useState(null)
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

  let contents
  if (activeCommit) {
    contents =  <MessageView message={activeCommit} onClose={() => setActiveCommit(null)} />
  } else {
    contents = (
      <CommitList
        repoName={name}
        commits={commits}
        isLoaded={loaded}
        onClick={(summary, body) => setActiveCommit(`${summary}\n\n${body}`)} />
    )
  }

  return (
    <div className="commits-container">
      <h1>Commits</h1>
      {contents}
    </div>
  )
}

export default CommitsContainer