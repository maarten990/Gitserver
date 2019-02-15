import React, { useState, useEffect } from 'react'
import Highlight from 'react-highlight'
import { Spinner } from "@blueprintjs/core";
import { apiCall, usePrevious } from './util.js'

const DiffItem = ({ diff }) => (
  <Highlight className="diff">
    {diff}
  </Highlight>
)

const DiffList = ({ diffs, isLoaded }) => {
  if (isLoaded) {
    return (
      <div className="diff-list">
        {diffs.map((diff, i) => <DiffItem diff={diff} key={i} />)}
      </div>
    )
  } else {
    return <Spinner intent='primary' />
  }
}

const getDiffs = (name, sha1, setDiffs, setLoaded) => {
  apiCall('get_diffs', { name: name, sha1: sha1 })
    .then(response => response.data)
    .catch(() => [])
    .then(diffs => {
      setDiffs(diffs)
      setLoaded(true)
    })
}

const DiffsContainer = ({ name, sha1 }) => {
  const [loaded, setLoaded] = useState(false)
  const [diffs, setDiffs] = useState([])
  const prevSha1 = usePrevious(sha1);

  useEffect(() => {
    if (prevSha1 !== sha1) {
      setLoaded(false)
    }
  }, [sha1])

  useEffect(() => {
    if (loaded) {
      return
    }

    getDiffs(name, sha1, setDiffs, setLoaded)
  }, [loaded])

  return (
    <div className='diffs-container'>
      <DiffList diffs={diffs} isLoaded={loaded} />
    </div>
  )
}

export default DiffsContainer