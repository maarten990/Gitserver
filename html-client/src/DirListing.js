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

const traverseTree = (tree, path) => (
  path.reduce((folders, pathEntry) => folders[pathEntry], treeToObject(tree))
)

const treeToObject = (tree) => {
  let out = {}

  tree.forEach(entry => {
    if (entry instanceof Object) {
      // map a folder object to its list of children and recursively convert those children
      const name = Object.keys(entry)[0];
      out[name] = treeToObject(entry[name]);
    } else {
      // map a string to itself
      out[entry] = entry;
    }
  })

  return out
}

const TreeView = ({ tree, path, repoName, sha1, isLoaded, fileOnClick, folderOnClick }) => {
  if (isLoaded) {
    const curFolder = traverseTree(tree, path)
    return (
      <div className='file-view-container'>
        <table className='tree-view'>
          <tbody>
            <FolderEntry name='..' key={-1} onClick={folderOnClick} />
            {Object.keys(curFolder).map(
              (key, i) => {
                if (curFolder[key] instanceof Object) {
                  return <FolderEntry name={key} key={i} onClick={folderOnClick} />
                } else {
                  return <FileEntry repoName={repoName} sha1={sha1} location={path} name={key} key={i} onClick={fileOnClick} />
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
    <div className='dir-listing'>
      <div className='current-path'>
        {`Path: /${currentPath.join('/')}`}
      </div>
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