import React, { useState, useEffect } from 'react'
import Highlight from 'react-highlight'
import ListPlaceholder from './ListPlaceholder'
import { apiCall, usePrevious } from './util.js'

const getFileContents = (name, sha1, path, setFileContents, setLoaded) => {
  apiCall('get_filecontents', { name: name, sha1: sha1, path: path })
    .then(response => response.data)
    .catch(() => '')
    .then(contents => {
      setFileContents(contents)
      setLoaded(true)
    })
}

const FileView = ({ name, sha1, path }) => {
  const [loaded, setLoaded] = useState(false)
  const [contents, setContents] = useState('')
  const prevSha1 = usePrevious(sha1)

  useEffect(() => {
    if (prevSha1 !== sha1) {
      setLoaded(false)
    }
  }, [loaded])

  useEffect(() => {
    if (loaded) {
      return
    }

    getFileContents(name, sha1, path, setContents, setLoaded)
  })

  if (loaded) {
    return (
      <Highlight>
        {contents}
      </Highlight>
    )
  } else {
    return <ListPlaceholder />
  }
}

export default FileView