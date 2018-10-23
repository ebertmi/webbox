import React from 'react';

import { Terminal as Term } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';

import capitalize from 'lodash/capitalize';
import debounce from 'lodash/debounce';
import isFunction from 'lodash/isFunction';
import Debug from 'debug';

import TerminalManager from '../../models/terminalManager';

const debug = Debug('webbox:Terminal');

const events = [
  'data', 'end', 'finish',
  'title', 'bell', 'destroy'
];

// Load fit addon
Term.applyAddon(fit);


export function once(type, listener) {
  if (!isFunction(listener)) {
    throw TypeError('listener must be a function');
  }

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
}

export function pipeXterm(src, dest) {
  let ondata;
  let onerror;
  let onend;

  function unbind() {
    src.removeListener('data', ondata);
    src.removeListener('error', onerror);
    src.removeListener('end', onend);
    dest.removeListener('error', onerror);
    dest.removeListener('close', unbind);
  }

  src.on('data', ondata = function ondata(data) {
    dest.write(data);
  });

  src.on('error', onerror = function onerror( err) {
    unbind();
    if (!this.listeners('error').length) {
      throw err;
    }
  });

  src.on('end', onend = function onend() {
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

    let reuse = false;

    if (this.props.process && TerminalManager.has(this.props.process.id)) {
      this.terminal = TerminalManager.get(this.props.process.id);

      reuse = true;
    } else {
      this.terminal = new Term({
        screenKeys: true,
        cursorBlink: true
      });

      // add once method as in xterm.js 3.x is was optimized away -.-
      this.terminal.once = once.bind(this.terminal);

      // add standard EventEmitter.removeListener
      this.terminal.removeListener = this.terminal.off;

      TerminalManager.set(this.props.process.id, this.terminal);
    }

    this.terminal.open(this.container);
    this.terminal.focus();

    this.terminal.setOption('fontFamily', this.props.fontFamily);
    this.terminal.setOption('fontSize', this.props.fontSize);

    window.addEventListener('resize', this.onResize);

    events.forEach(event => {
      this.terminal.on(event, (...args) => {
        const handler = this.props['on' + capitalize(event)];

        if (handler) {
          handler(...args);
        }
      });
    });

    this.onResize();
    this.terminal.refresh(0, this.terminal.rows - 1);
    this.terminal.focus();

    // Do not attach the streams again, after mounting again
    if (reuse === true) {
      return;
    }

    this.onStreamChange(reuse);
  }

  componentDidUpdate(prevProps) {
    if (!this.props.hidden) {
      this.onResize();
      //this.terminal.refresh(0, this.terminal.rows - 1);
      if (prevProps.hidden) {
        this.terminal.element.focus();
        this.terminal.focus();
      }
    }

    // apply changed props
    this.terminal.setOption('fontFamily', this.props.fontFamily);
    this.terminal.setOption('fontSize', this.props.fontSize);
  }

  componentWillUnmount() {
    if (this.props.process) {
      this.props.process.removeListener('streamsChanged', this.onStreamChange);
    }

    window.removeEventListener('resize', this.onResize);
  }

  onStreamChange(reuse) {
    const process = this.props.process;

    // Reset the terminal and delete old lines!
    if (reuse === false) {
      this.terminal.clear();
    }

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

    this.terminal.fit();
  }

  render() {
    const style = {
      fontFamily: this.props.fontFamily,
      fontSize: this.props.fontSize
    };

    return (
      <div className="terminal-wrapper" hidden={this.props.hidden}>
        <div style={style} className="terminal-container" hidden={this.props.hidden} ref={div => this.container = div}/>
      </div>);
  }
}
