require('scss/index');

import React from 'react';
import {render} from 'react-dom';

import Ide from '../../common/components/ide/ide';

render(
  <Ide/>,
  document.getElementById('container')
);
