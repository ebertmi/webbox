/**
 * Notebook pages entry file. This produces the notebook bundle.
 */
require('../scss/index.scss');

import '@babel/polyfill';
import 'whatwg-fetch';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import { disableBackspace } from '../../common/util/backspaceDisabler';

// own modules
import notebookStore from '../../common/store/notebookStore';
import { loadMonaco, BASE_MONACO_REQUIRE_CONFIG } from '../../common/util/monacoUtils';
import NotebookApp from '../../common/containers/notebook/NotebookApp';
import { documentToState, copyText } from '../../common/util/nbUtil';

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

// Convert our database model into an immutable state model
const notebookState = documentToState(window.__INITIAL_STATE__);

const storeInit = { notebook: notebookState };
const store = notebookStore(storeInit);
const rootElement = document.getElementById('notebook-container');

// Try to disable backspace to avoid page backward and forward actions while working in an editor.
disableBackspace();

// Add document handler for all copy buttons
document.addEventListener('click', function (event) {
  if (event.target.getAttribute('data-event') === 'code.copy') {
    // handle copy button click
    try {
      let parent = event.target.parentNode.parentNode;
      let hljs = parent.getElementsByClassName('hljs');
      if (hljs.length > 0) {
        let sourceText = hljs[0].textContent;

        let succeeded = copyText(hljs[0], sourceText);

        let message;
        let previousText = event.target.textContent || event.target.innerText;
        if (succeeded) {
          // ToDo: change button text and show copied for 5s then change back
          message = 'Kopiert';
        } else {
          message = 'Nicht unterstützt';
          // ToDo: change button text and show failed for 5s then change back
        }

        event.target.innerText = message;

        setTimeout(() => {
          if (event.target.innerText) {
            event.target.innerText = previousText;
          } else {
            event.target.textContent = previousText;
          }
        }, 1000*5);
      }
      event.preventDefault();
    } catch (_) {
      console.warn(_);
    }
  }
});

// Now load Monaco and bootstrap that thing
loadMonaco(window, BASE_MONACO_REQUIRE_CONFIG).then(monaco => {
  window.monaco = monaco;

  // render application with router and to the rootElement and
  // set the initialState
  render(
    <Provider store={store}>
      <NotebookApp />
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