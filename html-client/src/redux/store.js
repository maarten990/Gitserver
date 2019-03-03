import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import gitReducer, { cookieMap } from './actions'
import Cookies from 'js-cookie'

const loggingMiddleware = store => next => action => {
  console.log(`${action.type}: ${action.payload}`)
  next(action)
}

const cookieMiddleware = cookieMap => store => next => action => {
  next(action)
  if (cookieMap[action.type]) {
    const newValue = cookieMap[action.type].getValue(store.getState())
    Cookies.set(cookieMap[action.type].name, newValue)
  }
}

const store = createStore(
  gitReducer,
  applyMiddleware(thunk, cookieMiddleware(cookieMap), loggingMiddleware)
)

export default store
