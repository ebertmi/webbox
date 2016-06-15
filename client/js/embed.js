import '../scss/index.scss';
import 'babel-polyfill';
import React from 'react';
import {render} from 'react-dom';

import Ide from '../../common/components/ide/Ide';
import SourceboxProject from '../../common/models/sourcebox';
import { MessageListModel } from '../../common/models/messages';
import { usageConsole } from '../../common/util/usageLogger';

// depending on the way we serve the embeds we can either just get the initial data from
// window.INITIAL_DATA and then initialize the embed or some ajax request mechanism
let project;
if (window.INITIAL_DATA.meta.embedType === 'sourcebox') {
  project = new SourceboxProject(window.INITIAL_DATA, {
    auth: window.sourcebox.authToken,
    server: window.sourcebox.server
  });
} else {
  console.log('Unsupported embedType', window.INITIAL_DATA);
}

project.setCommunicationData(window.websocket.authToken, window.websocket.server);

// we maintain a IDE wide message list (notifications)
let messageList = new MessageListModel(usageConsole);
project.setMessageList(messageList); // project provides convience methods for displaying messages
project.setUserData(window.USER_DATA);

render(
  <Ide project={project} messageList={messageList}/>,
  document.getElementById('ide-container')
);
