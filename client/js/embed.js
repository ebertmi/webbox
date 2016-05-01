require('scss/index');

import React from 'react';
import {render} from 'react-dom';

import Ide from '../../common/components/ide/Ide';
import SourceboxProject from '../../common/models/sourcebox';
import { MessageList } from '../../common/models/messageList';

// depending on the way we serve the embeds we can either just get the initial data from
// window.INITIAL_DATA and then initialize the embed or some ajax request mechanism
let project;
if (window.INITIAL_DATA.meta.embedType === 'sourcebox') {
  project = new SourceboxProject(window.INITIAL_DATA, {
    auth: window.authToken,
    server: window.server
  });
} else {
  console.log('Unsupported embedType', window.INITIAL_DATA);
}

// we maintain a IDE wide message list (notifications)
let usageConsole = {
  log: function (message, messageText, severity) {
    if (severity === 'info') {
      console.info(message, messageText);
    } else if (severity === 'warning') {
      console.warn(message, messageText);
    } else {
      console.error(message, messageText);
    }
  }
};

let messageList = new MessageList(usageConsole);

render(
  <Ide project={project} messageList={messageList}/>,
  document.getElementById('ide-container')
);
