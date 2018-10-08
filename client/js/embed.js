require('../scss/index.scss');
import '@babel/polyfill';
import 'whatwg-fetch';import React from 'react';
import { render } from 'react-dom';

import Ide from '../../common/components/ide/Ide';
import SourceboxProject from '../../common/models/project/sourceboxProject';
import SkulptProject from '../../common/models/project/skulptProject';
import { MessageListModel } from '../../common/models/messages';
import { usageConsole } from '../../common/util/usageLogger';
import { loadMonaco, BASE_MONACO_REQUIRE_CONFIG } from '../../common/util/monacoUtils';
import { EmbedTypes } from '../../common/constants/Embed';

import { disableBackspace } from '../../common/util/backspaceDisabler';

import Debug from 'debug';

const debug = Debug('webbox:embed-entry');

// Try to disable backspace to avoid page backward and forward actions while working in an editor.
disableBackspace();

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

// We maintain a IDE wide message list (notifications)
let messageList = new MessageListModel(usageConsole);

let projectData = {
  embed: window.__INITIAL_DATA__,
  user: window.__USER_DATA__,
  messageList: messageList,
  communication: {
    jwt: window.__WEBSOCKET__.authToken,
    url: window.__WEBSOCKET__.server
  }
};

// Now load Monaco and bootstrap that thing
loadMonaco(window, BASE_MONACO_REQUIRE_CONFIG).then(monaco => {
  window.monaco = monaco;
  // depending on the way we serve the embeds we can either just get the initial data from
  // window.INITIAL_DATA and then initialize the embed or some ajax request mechanism
  let project;
  if (window.__INITIAL_DATA__.meta.embedType === EmbedTypes.Sourcebox) {
    project = new SourceboxProject(projectData, {
      auth: window.__SOURCEBOX__.authToken,
      server: window.__SOURCEBOX__.server,
      transports: window.__SOURCEBOX__.transports || ['websocket']
    });
  } else if (window.__INITIAL_DATA__.meta.embedType === EmbedTypes.Skulpt) {
    project = new SkulptProject(projectData);
  } else {
    console.error('Unsupported embedType', window.__INITIAL_DATA__);
  }

  render(
    <Ide project={project} messageList={messageList}/>,
    document.getElementById('ide-container')
  );
}).catch(err => {
  debug(err);
  render(
    <div className="alert alert-danger">Failed to load Editor dependencies</div>,
    document.getElementById('ide-container')
  );
});


