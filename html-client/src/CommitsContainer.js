import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Collapse, Classes, Spinner } from "@blueprintjs/core";
import { apiCall, usePrevious } from './util.js'

const Commit = ({ repoName, summary, body, sha1 }) => {
  const [isOpen, setIsOpen] = useState(false)
  const messageLines = body.split(/\n/)
  const buttonText = isOpen ? 'Collapse' : 'Expand'

  return (
    <>
      <tr>
        <td className={`commit-message ${Classes.MONOSPACE_TEXT}`}>
          <Link to={`/repo/${repoName}/${sha1}`}>{summary}</Link>
        </td>
        <td>
          {body ? <Button text={buttonText} intent='primary' onClick={e => setIsOpen(!isOpen)} /> : null}
        </td>
      </tr>
      <tr>
        <td className={Classes.TEXT_MUTED}>
          {sha1}
        </td>
      </tr>
      <tr>
        <td>
          <Collapse isOpen={isOpen}>
            {messageLines.map((line, i) => <p key={i}>{line}</p>)}
          </Collapse>
        </td>
      </tr>
    </>
  )
}

const CommitList = ({ repoName, commits, isLoaded }) => {
  if (isLoaded) {
    return (
      <table className="commit-list">
        <tbody>
          {commits.map((c, i) => <Commit repoName={repoName} summary={c.summary} body={c.body} sha1={c.sha1} key={i} />)}
        </tbody>
      </table>
    )
  } else {
    return <Spinner intent='primary' />
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
      <CommitList
        repoName={name}
        commits={commits}
        isLoaded={loaded} />
    </div>
  )
}

export default CommitsContainer