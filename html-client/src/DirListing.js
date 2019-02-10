import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile, faFolder } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import ListPlaceholder from './ListPlaceholder'
import { apiCall, usePrevious } from './util.js'

const FolderEntry = ({ name, onClick }) => (
  <tr>
    <td><FontAwesomeIcon icon={faFolder} /></td>
    <td>
      <button className='fileview-button' onClick={(e) => onClick(e, name)}>{name}</button>
    </td>
  </tr>
)

const FileEntry = ({ repoName, sha1, location, name }) => (
  <tr>
    <td><FontAwesomeIcon icon={faFile} /></td>
    <td>
      <Link to={`/repo/${repoName}/${sha1}/${Array.concat(location, name).join('/')}`}>{name}</Link>
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

const TreeView = ({ tree, path, repoName, sha1, isLoaded, fileOnClick, folderOnClick }) => {
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
                  return <FileEntry repoName={repoName} sha1={sha1} location={fullPath} name={item} key={i} onClick={fileOnClick} />
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

const DirListing = ({ name, sha1 }) => {
  const [loaded, setLoaded] = useState(false)
  const [dirTree, setDirTree] = useState({})
  const [currentPath, setCurrentPath] = useState([])
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
      <TreeView repoName={name} sha1={sha1} tree={dirTree} path={currentPath} isLoaded={loaded}
        folderOnClick={(e, name) => {
          e.preventDefault()
          if (name === '..') {
            setCurrentPath(currentPath.slice(0, -1))
          } else {
            setCurrentPath(Array.concat(currentPath, name))
          }
        }}
      />
    </div>
  )
}

export default DirListing