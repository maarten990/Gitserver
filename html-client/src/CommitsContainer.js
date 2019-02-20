import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { Card, Collapse, Classes, Spinner } from "@blueprintjs/core";
import { apiCall, usePrevious } from './util.js'

const Commit = withRouter(({ history, repoName, summary, body, sha1, isActive, setActive }) => {
  const messageLines = body.split(/\n/)

  return (
    <Card
      className={`commit-message ${isActive ? 'active' : null}`}
      interactive={true}
      onClick={() => {
        history.push(`/repo/${repoName}/${sha1}`)
        setActive(sha1)
      }}>
      {summary}
      <p className={`${Classes.TEXT_MUTED} ${Classes.TEXT_SMALL}`}>
        {sha1}
      </p>
      <Collapse isOpen={isActive}>
        {messageLines.map((line, i) => <p key={i}>{line}</p>)}
      </Collapse>
    </Card>
  )
})

const CommitList = ({ repoName, commits, isLoaded, activeCommit, setActive }) => {
  if (isLoaded) {
    return (
      <div className="commit-list">
        {commits.map((c, i) => (
          <Commit repoName={repoName} summary={c.summary} body={c.body} sha1={c.sha1} key={i} isActive={activeCommit === c.sha1} setActive={setActive} />
        ))}
      </div>
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

const CommitsContainer = ({ name, sha1 }) => {
  const [loaded, setLoaded] = useState(false)
  const [commits, setCommits] = useState([])
  const [active, setActive] = useState(sha1)
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
        isLoaded={loaded}
        activeCommit={active}
        setActive={setActive} />
    </div>
  )
}

export default CommitsContainer