require('scss/index');

import React from 'react';
import {render} from 'react-dom';

import Ide from '../../common/components/ide/Ide';
import SourceboxProject from '../../common/models/sourcebox';
import { MessageList } from '../../common/models/messages';
import { usageConsole } from '../../common/util/usageLogger';

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
let messageList = new MessageList(usageConsole);
project.setMessageList(messageList); // project provides convience methods for displaying messages

render(
  <Ide project={project} messageList={messageList}/>,
  document.getElementById('ide-container')
);
