import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import gitReducer from './actions';

const store = createStore(gitReducer, applyMiddleware(thunk))

export default store