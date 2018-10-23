/**
 * Presentation mode entry file. This produces the presentation bundle.
 */
require('../scss/index.scss');

import '@babel/polyfill';
import 'whatwg-fetch';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

// own modules
import notebookStore from '../../common/store/notebookStore';
import { loadMonaco, BASE_MONACO_REQUIRE_CONFIG } from '../../common/util/monacoUtils';

import PresentationApp from '../../common/containers/notebook/PresentationApp';
import { documentToState } from '../../common/util/nbUtil';

// DOMNode closest polyfill
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function (selector) {
    var el = this;
    while (el) {
      if (el.matches(selector)) {
        return el;
      }
      el = el.parentElement;
    }
  };
}

// Render the passed state from the template engine
const notebookState = documentToState(window.__INITIAL_STATE__);
const storeInit = { notebook: notebookState };
const store = notebookStore(storeInit);

const rootElement = document.getElementById('root');

// Now load Monaco and bootstrap that thing
loadMonaco(window, BASE_MONACO_REQUIRE_CONFIG).then(monaco => {
  window.monaco = monaco;

  // render application with router and to the rootElement and
  // set the initialState
  render(
    <Provider store={store}>
      <PresentationApp />
    </Provider>,
    rootElement
  );
}).catch(err => {
  console.error(err);
  render(
    <div className="alert alert-danger">Failed to load Editor dependencies</div>,
    document.getElementById('ide-container')
  );
});