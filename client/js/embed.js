require('scss/index');

import React from 'react';
import {render} from 'react-dom';

import Ide from '../../common/components/ide/Ide';
import SourceboxProject from '../../common/models/sourcebox';

// depending on the way we serve the embeds we can either just get the initial data from
// window.INITIAL_DATA and then initialize the embed or some ajax request mechanism
let project;
if (window.INITIAL_DATA.embedType === 'sourcebox') {
  project = new SourceboxProject(window.INITIAL_DATA, {
    auth: window.authToken,
    server: window.server
  });
} else {
  console.log('Unsupported embedType', window.INITIAL_DATA);
}

render(
  <Ide project={project}/>,
  document.getElementById('ide-container')
);
