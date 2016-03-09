// modules
import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';

// own modules
import configureStore from '../../common/store/configureStore';
import adminRoutes from '../../common/route/adminRoutes';
import App from '../../common/containers/admin/AdminApp';

// Styles
import '../scss/index.scss';

const initialState = window.__INITIAL_STATE__;
const store = configureStore(initialState);
console.log(store.getState());
const rootElement = document.getElementById('content');

// render application with router and to the rootElement and
// set the initialState
render(
  <Provider store={store}>
    <div>
      <Router history={browserHistory}>
        {adminRoutes}
      </Router>
    </div>
  </Provider>,
  rootElement
);