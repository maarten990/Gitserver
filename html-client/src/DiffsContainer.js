import React, { useEffect } from 'react'
import Highlight from 'react-highlight'
import { Spinner } from '@blueprintjs/core'
import { usePrevious } from './util.js'
import { connect } from 'react-redux'
import { diffsFetch } from './redux/actions'

const DiffItem = ({ diff }) => (
  <Highlight className='diff'>
    {diff}
  </Highlight>
)

const DiffList = ({ diffs, isLoaded }) => {
  if (isLoaded) {
    return (
      <div className='diff-list'>
        {diffs.map((diff, i) => <DiffItem diff={diff} key={i} />)}
      </div>
    )
  } else {
    return <Spinner intent='primary' />
  }
}

const DiffsContainer = ({ name, sha1, diffs, isLoaded, diffsFetch }) => {
  const prevSha1 = usePrevious(sha1)

  useEffect(() => {
    if (prevSha1 !== sha1) {
      diffsFetch(name, sha1)
    }
  }, [sha1])

  return (
    <div className='diffs-container'>
      <DiffList diffs={diffs} isLoaded={isLoaded} />
    </div>
  )
}

const mapStateToProps = state => {
  return {
    diffs: state.diffs.diffs,
    isLoaded: !state.diffs.loading
  }
}

const mapDispatchToProps = {
  diffsFetch
}

export default connect(mapStateToProps, mapDispatchToProps)(DiffsContainer)
