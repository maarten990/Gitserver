import React, { useState, useEffect } from 'react'
import { Button, Spinner, Tree } from "@blueprintjs/core";
import Highlight from 'react-highlight'
import { usePrevious } from './util.js'
import { connect } from 'react-redux'
import { dirtreeFetch, fileContentsFetch } from './redux/actions'

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

const TreeView = ({ tree, setRefresh, loadFile}) => {
  return (
    <Tree
      contents={tree}
      onNodeCollapse={node => {node.isExpanded = false; setRefresh(true)}}
      onNodeExpand={node => {node.isExpanded = true; setRefresh(true)}}
      onNodeClick={(node, path, e) => {
        if ('childNodes' in node) {
          node.isExpanded = !node.isExpanded
          setRefresh(true)
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


const DirListing = ({ name, sha1, tree, fileContents, isLoaded, dirtreeFetch, fileContentsFetch }) => {
  const [refresh, setRefresh] = useState(false)
  const [showFile, setShowFile] = useState(false)
  const prevSha1 = usePrevious(sha1)

  useEffect(() => {
    if (prevSha1 !== sha1) {
      dirtreeFetch(name, sha1)
    }
  }, [sha1])

  // keep changing this variable in vain to allow for the tree to rerender
  useEffect(() => {
    setRefresh(false)
  }, [refresh])

  let body
  if (!isLoaded) {
    body = <Spinner intent='primary' />
  } else if (showFile) {
    body = (
      <>
        <Button intent='primary' text='Back' onClick={() => setShowFile(false)} />
        <Highlight>
          {fileContents}
        </Highlight>
      </>
    )
  } else {
    body = (
      <TreeView
        tree={tree}
        setRefresh={setRefresh}
        loadFile={path => {
          fileContentsFetch(name, sha1, path)
          setShowFile(true)
        }} />
    )
  }

  return (
    <div className='dir-listing-container'>
      {body}
    </div>
  )
}

const mapStateToProps = state => {
  return {
    tree: formatTree(state.dirtree.tree),
    fileContents: state.dirtree.fileContents,
    isLoaded: !state.dirtree.loading,
  }
}

const mapDispatchToProps = {
  dirtreeFetch,
  fileContentsFetch,
}

export default connect(mapStateToProps, mapDispatchToProps)(DirListing)