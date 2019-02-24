import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { Card, Collapse, Classes, Spinner } from '@blueprintjs/core'
import { usePrevious } from './util.js'
import { connect } from 'react-redux'
import { commitsFetch } from './redux/actions'

let Commit = withRouter(({ history, repoName, summary, body, sha1, isActive, setActive }) => {
  const messageLines = body.split(/\n/)

  return (
    <Card
      className={`commit-message ${isActive ? 'active' : ''}`}
      interactive
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
      <div className='commit-list'>
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

const CommitsContainer = withRouter(({ history, name, sha1, commits, commitsFetch, isLoaded }) => {
  const [active, setActive] = useState(sha1)
  const prevRepoName = usePrevious(name)

  useEffect(() => {
    if (prevRepoName !== name) {
      commitsFetch(name, commits => {
        if (commits) {
          history.push(`/repo/${name}/${commits[0].sha1}`)
        }
      })
    }
  }, [name])

  return (
    <div className='commits-container'>
      <CommitList
        repoName={name}
        commits={commits}
        isLoaded={isLoaded}
        activeCommit={active}
        setActive={setActive} />
    </div>
  )
})

const mapStateToProps = state => {
  return {
    commits: state.commits.commits.map(summarizeCommit),
    isLoaded: !state.commits.loading
  }
}

const mapDispatchToProps = {
  commitsFetch
}

export default connect(mapStateToProps, mapDispatchToProps)(CommitsContainer)
