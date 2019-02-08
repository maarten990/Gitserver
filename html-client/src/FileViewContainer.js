import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile, faFolder } from '@fortawesome/free-solid-svg-icons'
import Highlight from 'react-highlight'
import ListPlaceholder from './ListPlaceholder'
import { apiCall, usePrevious } from './util.js'

const FileView = ({ contents }) => (
  <Highlight>
    {contents}
  </Highlight>
)

const FolderEntry = ({ name, onClick }) => (
  <tr>
    <td><FontAwesomeIcon icon={faFolder} /></td>
    <td>
      <button className='fileview-button' onClick={(e) => onClick(e, name)}>{name}</button>
    </td>
  </tr>
)

const FileEntry = ({ location, name, onClick }) => (
  <tr>
    <td><FontAwesomeIcon icon={faFile} /></td>
    <td>
      <button className='fileview-button'
        onClick={(e) => onClick(e, Array.concat(location, name).join('/'))}>
        {name}
      </button>
    </td>
  </tr>
)

const traverseTree = (tree, path) => {
  let curFolder = tree
  path.reverse()
  let outPath = []
  while (path.length > 0) {
    const item = path.pop()
    curFolder = curFolder.find(value => Object.keys(value)[0] === item)[item]
    outPath.push(item)
  }

  return [outPath, curFolder]
}

const TreeView = ({ tree, path, isLoaded, fileOnClick, folderOnClick }) => {
  if (isLoaded) {
    const [fullPath, curFolder] = traverseTree(tree, path)
    return (
      <div className='file-view-container'>
        <table className='tree-view'>
          <tbody>
            <FolderEntry name='..' key={-1} onClick={folderOnClick} />
            {curFolder.map(
              (item, i) => {
                if (item instanceof Object) {
                  return <FolderEntry name={Object.keys(item)[0]} key={i} onClick={folderOnClick} />
                } else {
                  return <FileEntry location={fullPath} name={item} key={i} onClick={fileOnClick} />
                }
              })}
          </tbody>
        </table>
      </div>
    )
  } else {
    return <ListPlaceholder />
  }
}

const getDirTree = (name, sha1, setDirTree, setLoaded) => {
  apiCall('get_dirtree', { name: name, sha1: sha1 })
    .then(response => response.data['/'])
    .catch(() => {})
    .then(tree => {
      setDirTree(tree)
      setLoaded(true)
    })
}

const getFileContents = (name, sha1, path, setFileContents, setLoaded) => {
  apiCall('get_filecontents', { name: name, sha1: sha1, path: path })
    .then(response => response.data)
    .catch(() => '')
    .then(contents => {
      setFileContents(contents)
      setLoaded(true)
    })
}

const FileViewContainer = ({ name, sha1 }) => {
  const [loaded, setLoaded] = useState(false)
  const [dirTree, setDirTree] = useState({})
  const [currentPath, setCurrentPath] = useState([])
  const [fileContents, setFileContents] = useState('')
  const prevSha1 = usePrevious(sha1)

  useEffect(() => {
    if (prevSha1 !== sha1) {
      setLoaded(false)
    }
  })

  useEffect(() => {
    if (loaded) {
      return
    }

    getDirTree(name, sha1, setDirTree, setLoaded)
  })

  return (
    <div className='ui-row'>
      <TreeView tree={dirTree} path={currentPath} isLoaded={loaded}
        fileOnClick={(e, path) => {
          e.preventDefault()
          getFileContents(name, sha1, path, setFileContents, setLoaded)
        }}
        folderOnClick={(e, name) => {
          e.preventDefault()
          if (name === '..') {
            setCurrentPath(currentPath.slice(0, -1))
          } else {
            setCurrentPath(Array.concat(currentPath, name))
          }
        }}
      />
      <FileView contents={fileContents} />
    </div>
  )
}

export default FileViewContainer