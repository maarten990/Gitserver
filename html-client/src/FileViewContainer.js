import React from 'react'
import ListPlaceholder from './ListPlaceholder'
import { apiCall } from './util.js'

const FolderEntry = ({ name, onClick }) => (
  <tr>
    <td>FOLDER ICON</td>
    <td>
      <a onClick={(e) => onClick(e, name)} href="">{name}</a>
    </td>
  </tr>
)

const FileEntry = ({ location, name, onClick }) => (
  <tr>
    <td>FILE ICON</td>
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
    curFolder = curFolder.find(value => Object.keys(value)[0] == item)[item]
    outPath.push(item)
  }

  return [outPath, curFolder]
}

const TreeView = ({ tree, path, isLoaded, fileOnClick, folderOnClick }) => {
  if (isLoaded) {
    const [fullPath, curFolder] = traverseTree(tree, path)
    return (
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
    )
  } else {
    return <ListPlaceholder />
  }
}

class FileViewContainer extends React.Component {
  state = {
    isLoaded: false,
    fileTree: {},
    currentPath: [],
    error: "",
    repoName: this.props.match.params.name,
    sha1: this.props.match.params.sha1,
    shaChanged: true
  }

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

  static getDerivedStateFromProps(nextProps, prevState) {
    const newName = nextProps.match.params.name
    const newSha = nextProps.match.params.sha1

    if (newSha !== prevState.sha1 || newName !== prevState.repoName) {
      return {
        isLoaded: false,
        fileTree: {},
        currentPath: [],
        error: "",
        shaChanged: true,
        repoName: newName,
        sha1: newSha
      }
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
      <div className="fileview-container">
        <TreeView tree={this.state.fileTree} path={this.state.currentPath} isLoaded={this.state.isLoaded}
          fileOnClick={(e, path) => {
            e.preventDefault()
            console.log(path)
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
      </div>
    )
  }
}

export default FileViewContainer