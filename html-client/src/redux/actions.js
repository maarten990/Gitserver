import { apiCall } from '../util.js'
import { createAction, handleActions } from 'redux-actions'
import Cookies from 'js-cookie'

export const reposSet = createAction('REPOS_SET')
export const repoAdd = createAction('REPO_ADD')
export const repoRemove = createAction('REPO_REMOVE')
export const repoSetLoading = createAction('REPO_SET_LOADING')
export const commitsSet = createAction('COMMITS_SET')
export const commitsSetLoading = createAction('COMMITS_SET_LOADING')
export const diffsSet = createAction('DIFFS_SET')
export const diffsSetLoading = createAction('DIFFS_SET_LOADING')
export const dirtreeSet = createAction('DIRTREE_SET')
export const dirtreeSetLoading = createAction('DIRTREE_SET_LOADING')
export const dirtreeSetFileContents = createAction('DIRTREE_SET_FILE_CONTENTS')
export const toggleDarkMode = createAction('TOGGLE_DARK_MODE')

export const reposFetch = () =>
  (dispatch, getState) => {
    dispatch(repoSetLoading(true))
    apiCall('get_repositories')
      .then(response => response.data)
      .catch(() => [])
      .then(repos => {
        dispatch(reposSet(repos))
        dispatch(repoSetLoading(false))
      })
  }

export const repoCreate = (name, onSuccess, onFail) =>
  (dispatch, getState) => {
    apiCall('create_repository', { name: name })
      .then(response => {
        if (response.data.success) {
          dispatch(repoAdd(name))
        }
        return response.data.success
      })
      .catch(() => false)
      .then(success => success ? onSuccess() : onFail())
  }

export const repoDelete = (name, onSuccess, onFail) =>
  (dispatch, getState) => {
    apiCall('delete_repository', { name: name })
      .then(response => {
        if (response.data.success) {
          dispatch(repoRemove(name))
        }
        return response.data.success
      })
      .catch(() => false)
      .then(success => success ? onSuccess() : onFail())
  }

export const commitsFetch = (name, onSuccess) =>
  (dispatch, getState) => {
    dispatch(commitsSetLoading(true))
    apiCall('get_commits', { name: name })
      .then(response => response.data)
      .catch(() => [])
      .then(commits => {
        dispatch(commitsSet(commits))
        dispatch(commitsSetLoading(false))
        onSuccess(commits)
      })
  }

export const diffsFetch = (name, sha1) =>
  (dispatch, getState) => {
    dispatch(diffsSetLoading(true))
    apiCall('get_diffs', { name: name, sha1: sha1 })
      .then(response => response.data)
      .catch(() => [])
      .then(diffs => {
        dispatch(diffsSet(diffs))
        dispatch(diffsSetLoading(false))
      })
  }

export const dirtreeFetch = (name, sha1) =>
  (dispatch, getState) => {
    dispatch(dirtreeSetLoading(true))
    apiCall('get_dirtree', { name: name, sha1: sha1 })
      .then(response => response.data.children)
      .catch(() => { })
      .then(tree => {
        dispatch(dirtreeSet(tree))
        dispatch(dirtreeSetLoading(false))
      })
  }

export const fileContentsFetch = (name, sha1, path) =>
  (dispatch, getState) => {
    dispatch(dirtreeSetLoading(true))
    apiCall('get_filecontents', { name: name, sha1: sha1, path: path })
      .then(response => response.data)
      .catch(() => '')
      .then(contents => {
        dispatch(dirtreeSetFileContents(contents))
        dispatch(dirtreeSetLoading(false))
      })
  }

export let initialState = {
  repositories: {
    repositories: [],
    loading: false
  },

  commits: {
    commits: [],
    loading: false
  },

  diffs: {
    diffs: [],
    loading: false
  },

  dirtree: {
    tree: [],
    loading: false,
    fileContents: ''
  },

  shared: {
    darkMode: Cookies.get('darkMode') === 'true'
  }
}

export const cookieMap = {
  [toggleDarkMode]: {
    name: 'darkMode',
    getValue: state => state.shared.darkMode
  }
}

const repositories = handleActions({
  [reposSet]: (state, { payload }) => ({ ...state, repositories: payload }),
  [repoAdd]: (state, { payload }) => ({ ...state, repositories: state.repositories.concat(payload) }),
  [repoRemove]: (state, { payload }) => ({ ...state, repositories: state.repositories.filter(name => name !== payload) }),
  [repoSetLoading]: (state, { payload }) => ({ ...state, loading: payload })
}, initialState.repositories)

const commits = handleActions({
  [commitsSet]: (state, { payload }) => ({ ...state, commits: payload }),
  [commitsSetLoading]: (state, { payload }) => ({ ...state, loading: payload })
}, initialState.commits)

const diffs = handleActions({
  [diffsSet]: (state, { payload }) => ({ ...state, diffs: payload }),
  [diffsSetLoading]: (state, { payload }) => ({ ...state, loading: payload })
}, initialState.diffs)

const dirtree = handleActions({
  [dirtreeSet]: (state, { payload }) => ({ ...state, tree: payload }),
  [dirtreeSetLoading]: (state, { payload }) => ({ ...state, loading: payload }),
  [dirtreeSetFileContents]: (state, { payload }) => ({ ...state, fileContents: payload })
}, initialState.dirtree)

const shared = handleActions({
  [toggleDarkMode]: (state, action) => ({ ...state, darkMode: !state.darkMode })
}, initialState.shared)

const gitReducer = (state = initialState, action) => {
  return {
    repositories: repositories(state.repositories, action),
    commits: commits(state.commits, action),
    diffs: diffs(state.diffs, action),
    dirtree: dirtree(state.dirtree, action),
    shared: shared(state.shared, action)
  }
}

export default gitReducer
