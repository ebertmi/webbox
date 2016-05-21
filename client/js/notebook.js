// styles
require('scss/index');

import 'babel-polyfill';
import 'exports?fetch!whatwg-fetch/fetch';

import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
//import { Router, browserHistory } from 'react-router';

// own modules
import notebookStore from '../../common/store/notebookStore';
//import notebookRoutes from '../../common/route/NotebookRoutes';

import NotebookApp from '../../common/containers/notebook/NotebookApp';

// ToDo: later we render from the passed state from the template engine
//const initialState = window.__INITIAL_STATE__;
const store = notebookStore();
const rootElement = document.getElementById('notebook-container');

// render application with router and to the rootElement and
// set the initialState
render(
  <Provider store={store}>
    <NotebookApp />
  </Provider>,
  rootElement
);