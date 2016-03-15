require('scss/index');

import React from 'react';
import {render} from 'react-dom';

import Ide from './components/ide';

render(
  <Ide/>,
  document.getElementById('container')
);
