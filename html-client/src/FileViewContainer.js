import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile, faFolder } from '@fortawesome/free-solid-svg-icons'
import ListPlaceholder from './ListPlaceholder'
import { apiCall } from './util.js'

const FileLine = ({ line }) => (
  <div className='file-line'>
    {line}
  </div>
)

const FileView = ({ contents }) => (
  <div className='file-view'>
    {contents.split("\n").map((line, i) => <FileLine line={line} key={i} />)}
  </div>
)

const FolderEntry = ({ name, onClick }) => (
  <tr>
    <td><FontAwesomeIcon icon={faFolder} /></td>
    <td>
      <a onClick={(e) => onClick(e, name)} href="">{name}</a>
    </td>
  </tr>
)

const FileEntry = ({ location, name, onClick }) => (
  <tr>
    <td><FontAwesomeIcon icon={faFile} /></td>
    <td>
      <a onClick={(e) => onClick(e, Array.concat(location, name))} href="">{name}</a>
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

const zeroState = (props) => {
  return {
    isLoaded: false,
    fileTree: {},
    currentPath: [],
    error: '',
    fileContents: '',
    repoName: props.match.params.name,
    sha1: props.match.params.sha1,
    shaChanged: true
  }
}

class FileViewContainer extends React.Component {
  state = zeroState(this.props)

  getFromRemote() {
    apiCall('get_dirtree', { name: this.state.repoName, sha1: this.state.sha1 })
      .then(result => {
        const tree = (result.data === null) ? {} : result.data
        this.setState((state, props) => {
          return {
            isLoaded: true,
            fileTree: tree["/"],
            shaChanged: false
          }
        })
      })
      .catch(() =>
        this.setState({
          isLoaded: true,
          error: 'Could not reach server or repository/commit does not exist.',
          shaChanged: false
        }))
  }

  getFileContents(path) {
    apiCall('get_filecontents', { name: this.state.repoName, sha1: this.state.sha1, path: path })
      .then(result => {
        const contents = (result.data === null) ? "" : result.data
        this.setState((state, props) => {
          return {
            fileContents: contents
          }
        })
      })
      .catch(() =>
        this.setState({
          error: 'Could not reach server or repository/commit does not exist.',
        }))
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const newName = nextProps.match.params.name
    const newSha = nextProps.match.params.sha1

    if (newSha !== prevState.sha1 || newName !== prevState.repoName) {
      return zeroState(nextProps)
    } else {
      return null
    }
  }

  componentDidMount() {
    this.getFromRemote()
  }

  componentDidUpdate() {
    if (this.state.shaChanged) {
      this.getFromRemote()
    }
  }

  render() {
    return (
      <div className='ui-row'>
        <TreeView tree={this.state.fileTree} path={this.state.currentPath} isLoaded={this.state.isLoaded}
          fileOnClick={(e, path) => {
            e.preventDefault()
            this.getFileContents(path)
          }}
          folderOnClick={(e, name) => {
            e.preventDefault()
            this.setState((state, props) => {
              return {
                currentPath: Array.concat(state.currentPath, name)
              }
            })
          }}
          />
        <FileView contents={this.state.fileContents}/>
      </div>
    )
  }
}

export default FileViewContainer