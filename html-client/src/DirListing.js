import React, { useState, useEffect } from 'react'
import { Button, Spinner, Tree } from "@blueprintjs/core";
import Highlight from 'react-highlight'
import { apiCall, usePrevious } from './util.js'

var id = 0;
const getId = () => {
  id += 1;
  return id - 1;
}

const formatTree = (tree) => {
  let out = []

  tree.forEach(entry => {
    if (entry instanceof Object) {
      const name = Object.keys(entry)[0];
      out.push({
        id: getId(),
        label: name,
        icon: 'folder-close',
        childNodes: formatTree(entry[name]),
      })
    } else {
      out.push({
        id: getId(),
        label: entry,
        icon: 'document',
      })
    }
  })

  return out
}

const getFileContents = (name, sha1, path, setFileContents) => {
  setFileContents({loading: true})
  apiCall('get_filecontents', { name: name, sha1: sha1, path: path })
    .then(response => response.data)
    .catch(() => '')
    .then(contents => {
      setFileContents(contents)
    })
}

const TreeView = ({ tree, setRefresh, loadFile}) => {
  return (
    <Tree
      contents={tree}
      onNodeCollapse={node => {node.isExpanded = false; setRefresh(true)}}
      onNodeExpand={node => {node.isExpanded = true; setRefresh(true)}}
      onNodeClick={(node, path, e) => {
        if ('childNodes' in node) {
          return
        } else {
          const baseFolder = path[0]
          const rest = path.slice(1)
          let curFolder = tree[baseFolder]
          const pathStrings = []
          rest.forEach(i => {
            pathStrings.push(curFolder.label)
            curFolder = curFolder.childNodes[i]
          })
          pathStrings.push(node.label)
          loadFile(pathStrings.join('/'))
        }
      }}
    />
  )
}

const getDirTree = (name, sha1, setDirTree, setLoaded) => {
  apiCall('get_dirtree', { name: name, sha1: sha1 })
    .then(response => response.data['/'])
    .catch(() => {})
    .then(tree => {
      setDirTree(formatTree(tree))
      setLoaded(true)
    })
}

const DirListing = ({ name, sha1 }) => {
  const [loaded, setLoaded] = useState(false)
  const [dirTree, setDirTree] = useState({})
  const [refresh, setRefresh] = useState(false)
  const [fileContents, setFileContents] = useState(null)
  const prevSha1 = usePrevious(sha1)

  useEffect(() => {
    if (prevSha1 !== sha1) {
      setLoaded(false)
    }
  }, [sha1])

  useEffect(() => {
    if (loaded) {
      return
    }

    getDirTree(name, sha1, setDirTree, setLoaded)
  }, [loaded])

  // keep changing this variable in vain to allow for the tree to rerender
  useEffect(() => {
    setRefresh(false)
  }, [refresh])

  let body
  if (!loaded) {
    body = <Spinner intent='primary' />
  } else if (fileContents) {
    if (fileContents instanceof Object) {
      body = <Spinner intent='primary' />
    } else {
      body = (
        <>
          <Button intent='primary' text='Back' onClick={() => setFileContents(null)} />
          <Highlight>
            {fileContents}
          </Highlight>
        </>
      )
    }
  } else {
    body = (
      <TreeView
        tree={dirTree}
        setRefresh={setRefresh}
        loadFile={path => getFileContents(name, sha1, path, setFileContents)} />
    )
  }

  return (
    <div className='dir-listing-container'>
      <h1>Files</h1>
      {body}
    </div>
  )
}

export default DirListing