// styles
import '../scss/index.scss';

import 'babel-polyfill';
import 'exports?fetch!whatwg-fetch/fetch';

import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

// own modules
import notebookStore from '../../common/store/notebookStore';

import PresentationApp from '../../common/containers/notebook/PresentationApp';

// ToDo: later we render from the passed state from the template engine
//const initialState = window.__INITIAL_STATE__;
const store = notebookStore();
const rootElement = document.getElementById('root');

// render application with router and to the rootElement and
// set the initialState
render(
  <Provider store={store}>
    <PresentationApp />
  </Provider>,
  rootElement
);