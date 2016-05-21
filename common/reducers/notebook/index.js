import { combineReducers } from 'redux';
import notebook from './notebookReducer';
const rootReducer = combineReducers({
  notebook
});

export default rootReducer;