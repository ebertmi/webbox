require('scss/index');

import {Duplex} from 'stream';

import React from 'react';
import Term from 'term.js';

import capitalize from 'lodash/capitalize';

const events = [
  'data', 'end', 'finish',
  'title', 'bell', 'destroy'
];

export default class Terminal extends React.Component {
  focus() {
    this.terminal.focus();
  }

  componentDidMount() {
    this.terminal = new Term({
      useStyle: false
    });

    this.terminal.open(this.container);

    let stream = this.props.stream;

    if (stream) {
      stream.setEncoding('utf8');

      stream.pipe(this.terminal, {
        end: false
      }).pipe(stream);
    }

    events.forEach(event => {
      this.terminal.on(event, (...args) => {
        let handler = this.props['on' + capitalize(event)];

        if (handler) {
          handler(...args);
        }
      });
    });
  }

  componentWillUnmount() {
    this.terminal.destroy();
  }

  render() {
    return <div {...this.props} ref={div => this.container = div}/>;
  }
}

Terminal.propTypes = {
  stream: React.PropTypes.instanceOf(Duplex),
  onTitle: React.PropTypes.func
};
