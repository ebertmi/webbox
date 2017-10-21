// modules
import 'babel-polyfill';
import 'exports-loader?fetch!whatwg-fetch/fetch';

import React from 'react';
import { hydrate } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';

// own modules
import dashboardStore from '../../common/store/dashboardStore';
import adminRoutes from '../../common/route/AdminRoutes';

// Styles
require('../scss/index.scss');

const initialState = window.__INITIAL_STATE__;
const store = dashboardStore(initialState);
const rootElement = document.getElementById('content');

// render application with router and to the rootElement and
// set the initialState
hydrate(
  <Provider store={store}>
    <div>
      <Router history={browserHistory}>
        {adminRoutes}
      </Router>
    </div>
  </Provider>,
  rootElement
);
