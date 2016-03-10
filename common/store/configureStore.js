import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import rootReducer from '../reducers';
import adminSaga from '../sagas/admin';

// create Saga Middleware for generator support
const sagaMiddleware = createSagaMiddleware(adminSaga);

export default function configureStore(initialState) {
  const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(sagaMiddleware)
  );

  return store;
}