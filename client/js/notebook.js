// styles
import '../scss/index.scss';

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
import { documentToState } from '../../common/util/nbUtil';

// ToDo: later we render from the passed state from the template engine
const notebookState = documentToState(window.__INITIAL_STATE__);
const storeInit = { notebook: notebookState };
const store = notebookStore(storeInit);
const rootElement = document.getElementById('notebook-container');

// add document handler for all copy buttons
/*document.addEventListener('click', function (event) {
  console.log(event);
  if (event.target.getAttribute('data-event') === 'code.copy') {
    console.log('handle copy');
    // handle copy button click
    try {
      let parent = event.target.parentNode.parentNode;
      let hljs = parent.getElementsByClassName('hljs');
      if (hljs.length > 0) {
        let sourceText = hljs[0].innerText;
        let succeeded;

        try {
          succeeded = document.execCommand(this.action);
        } catch (err) {
          succeeded = false;
        }
      }
      event.preventDefault();
    } catch (_) {
      console.warn(_);
    }
  }
});*/

// render application with router and to the rootElement and
// set the initialState
render(
  <Provider store={store}>
    <NotebookApp />
  </Provider>,
  rootElement
);

