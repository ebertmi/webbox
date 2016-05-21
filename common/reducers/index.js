import { combineReducers } from 'redux';
import dashboardApp from './dashboard';
import userOverview from './user';
import embedOverview from './embed';
import courseOverview from './course';
import logOverview from './log';
import authAttemptOverview from './authattempt';

const rootReducer = combineReducers({
  dashboardApp,
  userOverview,
  embedOverview,
  courseOverview,
  logOverview,
  authAttemptOverview
});

export default rootReducer;