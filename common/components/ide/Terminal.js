import React from 'react';

import Term from 'xterm';

import capitalize from 'lodash/capitalize';
import debounce from 'lodash/debounce';

const events = [
  'data', 'end', 'finish',
  'title', 'bell', 'destroy'
];

export function pipeXterm(src, dest) {
  var ondata;
  var onerror;
  var onend;

  function unbind() {
    src.removeListener('data', ondata);
    src.removeListener('error', onerror);
    src.removeListener('end', onend);
    dest.removeListener('error', onerror);
    dest.removeListener('close', unbind);
  }

  src.on('data', ondata = function(data) {
    dest.write(data);
  });

  src.on('error', onerror = function(err) {
    unbind();
    if (!this.listeners('error').length) {
      throw err;
    }
  });

  src.on('end', onend = function() {
    dest.end();
    unbind();
  });

  dest.on('error', onerror);
  dest.on('close', unbind);

  dest.emit('pipe', src);

  return dest;
}

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

    this.onStreamChange();
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
    this.terminal.clear();

    if (process.stdin) {
      pipeXterm(this.terminal, process.stdin);
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
    this.terminal.focus();
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

    if (this.terminal.cols !== cols || this.terminal.rows != rows) {
      this.terminal.resize(cols, rows);
      if (this.props.onResize) {
        this.props.onResize(cols, rows);
      }
    }
  }

  render() {
    let style = {
      fontFamily: this.props.fontFamily,
      fontSize: this.props.fontSize
    };

    return <div className="terminal-wrapper" hidden={this.props.hidden}><div style={style} className="terminal-container" hidden={this.props.hidden} ref={div => this.container = div}/></div>;
  }
}
