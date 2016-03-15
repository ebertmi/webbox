'use strict';

import { combineReducers } from 'redux';
import dashboardApp from './dashboard';
import userOverview from './user';
import embedOverview from './embed';
import courseOverview from './course';

// empty for now
const rootReducer = combineReducers({
  dashboardApp,
  userOverview,
  embedOverview,
  courseOverview
});

export default rootReducer;