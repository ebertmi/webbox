require('../scss/index.scss');
import 'babel-polyfill';
import 'exports-loader?fetch!whatwg-fetch/fetch';
import React from 'react';
import {render} from 'react-dom';

import moment from 'moment';
import 'moment/locale/de';
moment.locale('de');

import Ide from '../../common/components/ide/Ide';
import SourceboxProject from '../../common/models/project/sourceboxProject';
import SkulptProject from '../../common/models/project/skulptProject';
import { MessageListModel } from '../../common/models/messages';
import { usageConsole } from '../../common/util/usageLogger';
import { EmbedTypes } from '../../common/constants/Embed';

import { disableBackspace } from '../../common/util/backspaceDisabler';

import 'expose-loader?Perf!react-addons-perf';

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
  embed: window.INITIAL_DATA,
  user: window.USER_DATA,
  messageList: messageList,
  communication: {
    jwt: window.websocket.authToken,
    url: window.websocket.server
  }
};

// depending on the way we serve the embeds we can either just get the initial data from
// window.INITIAL_DATA and then initialize the embed or some ajax request mechanism
let project;
if (window.INITIAL_DATA.meta.embedType === EmbedTypes.Sourcebox) {
  project = new SourceboxProject(projectData, {
    auth: window.sourcebox.authToken,
    server: window.sourcebox.server,
    transports: window.sourcebox.transports || ['websocket']
  });
} else if (window.INITIAL_DATA.meta.embedType === EmbedTypes.Skulpt) {
  project = new SkulptProject(projectData);
} else {
  console.error('Unsupported embedType', window.INITIAL_DATA);
}

render(
  <Ide project={project} messageList={messageList}/>,
  document.getElementById('ide-container')
);
