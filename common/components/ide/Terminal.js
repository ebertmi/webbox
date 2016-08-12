import React from 'react';
//import Term from 'term.js';
import Term from 'xterm';
import 'xterm/addons/fit/fit';
import 'xterm/addons/attach/attach';
import '../../util/xterm.pipe';

import capitalize from 'lodash/capitalize';
import debounce from 'lodash/debounce';

const events = [
  'data', 'end', 'finish',
  'title', 'bell', 'destroy'
];

export default class Terminal extends React.Component {
  constructor(props) {
    super(props);

    this.onStreamChange = this.onStreamChange.bind(this);
    this.onResize = debounce(this.onResize.bind(this), 100, true);
  }

  componentDidMount() {
    if (this.props.process) {
      this.props.process.on('streamsChanged', this.onStreamChange);
    }

    this.terminal = new Term({
      /*useStyle: false,*/
      screenKeys: true,
      cursorBlink: true
    });

    this.terminal.open(this.container);
    this.terminal.fit();

    this.onStreamChange();

    window.addEventListener('resize', this.onResize);

    events.forEach(event => {
      this.terminal.on(event, (...args) => {
        let handler = this.props['on' + capitalize(event)];

        if (handler) {
          handler(...args);
        }
      });
    });

    this.onResize();
  }

  componentWillUnmount() {
    if (this.props.process) {
      this.props.process.removeListener('streamsChanged', this.onStreamChange);
    }

    window.removeEventListener('resize', this.onResize);
    this.terminal.destroy();
  }

  componentDidUpdate(prevProps) {
    if (!this.props.hidden) {
      this.onResize();
      if (prevProps.hidden) {
        this.terminal.element.focus();
        this.terminal.focus();
      }
    }
  }

  onStreamChange() {
    let process = this.props.process;

    // Reset the terminal and delete old lines!
    this.terminal.eraseInDisplay([2]);
    this.terminal.cursorPos([1, 1]);
    this.terminal.refresh(0, this.terminal.rows - 1);

    if (process.stdin) {
      this.terminal.pipe(process.stdin);
    }

    if (process.stdout) {
      process.stdout.setEncoding('utf8');
      process.stdout.pipe(this.terminal, {
        end: false
      });
    }

    if (process.stderr && process.stderr !== process.stdout) {
      process.stderr.setEncoding('utf8');
      process.stderr.pipe(this.terminal, {
        end: false
      });
    }


    this.terminal.refresh();
  }

  onResize() {
    if (this.props.hidden) {
      return;
    }

    let { clientWidth: parentWidth, clientHeight: parentHeight } = this.container;
    let { clientWidth, clientHeight, offsetWidth, offsetHeight, scrollWidth, scrollHeight } = this.terminal.element;

    let x = (parentWidth - (offsetWidth - clientWidth)) / scrollWidth;
    let y = (parentHeight - (offsetHeight - clientHeight)) / scrollHeight;

    let cols = x * this.terminal.cols | 0;
    let rows = y * this.terminal.rows | 0;

    if (this.terminals !== cols || this.terminal.rows != rows) {
      this.terminal.resize(cols, rows);
      if (this.props.onResize) {
        this.props.onResize(cols, rows);
      }
    }

    //this.terminal.fit();
  }

  render() {
    let style = {
      fontFamily: this.props.fontFamily,
      fontSize: this.props.fontSize
    };

    return <div style={style} className="terminal-container" hidden={this.props.hidden} ref={div => this.container = div}/>;
  }
}
