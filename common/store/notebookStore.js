import { createStore } from 'redux';
import rootReducer from '../reducers/notebook';

export default function configureStore(initialState) {
  const store = createStore(
    rootReducer,
    initialState
  );

  return store;
}