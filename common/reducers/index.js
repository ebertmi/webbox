import { combineReducers } from 'redux';
import dashboardApp from './dashboard';
import userOverview from './user';
import embedOverview from './embed';
import documentOverview from './document';
import courseOverview from './course';
import logOverview from './log';
import authAttemptOverview from './authattempt';
import recyclebinOverview from './recyclebin';
import mailOverview from './mail';

const rootReducer = combineReducers({
  dashboardApp,
  userOverview,
  embedOverview,
  courseOverview,
  logOverview,
  documentOverview,
  authAttemptOverview,
  recyclebinOverview,
  mailOverview
});

export default rootReducer;