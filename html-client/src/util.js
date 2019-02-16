import { useEffect, useRef } from 'react'
const API_URL = '/api'

const endpoints = {
  'get_repositories': { url: 'get_repositories', method: 'GET' },
  'get_commits': { url: 'get_commits', method: 'GET' },
  'get_diffs': { url: 'get_diffs', method: 'GET' },
  'get_dirtree': { url: 'get_dirtree', method: 'GET' },
  'get_filecontents': { url: 'get_filecontents', method: 'GET' },
  'create_repository': { url: 'create_repository', method: 'POST' },
  'delete_repository': { url: 'delete_repository', method: 'POST' }
}

const apiCall = async (endpoint, args = {}) => {
  if (!endpoints.hasOwnProperty(endpoint)) {
    throw Error('Unknown API endpoint')
  }

  const { url, method } = endpoints[endpoint]

  if (method === 'POST') {
    let formData = new window.FormData()

    for (let key in args) {
      formData.append(key, args[key])
    }

    const response = await window.fetch(`${API_URL}/${url}`, {
      method: 'POST',
      body: formData
    })

    return response.json()
  } else if (method === 'GET') {
    const queryArgs = []

    for (let key in args) {
      queryArgs.push(`${encodeURIComponent(key)}=${encodeURIComponent(args[key])}`)
    }

    const query = `${queryArgs.join('&')}`
    const response = await window.fetch(`${API_URL}/${url}?${query}`, {
      method: 'GET'
    })

    return response.json()
  }
}

const usePrevious = (value) => {
  const ref = useRef()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export { apiCall, usePrevious }
