import React from 'react';

import Term from 'xterm';

import capitalize from 'lodash/capitalize';
import debounce from 'lodash/debounce';

const events = [
  'data', 'end', 'finish',
  'title', 'bell', 'destroy'
];

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

    this.terminal.open(this.container, true);

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

  componentDidUpdate(prevProps) {
    if (!this.props.hidden) {
      this.onResize();
      if (prevProps.hidden) {
        this.terminal.element.focus();
        this.terminal.focus();
      }
    }
  }

  componentWillUnmount() {
    if (this.props.process) {
      this.props.process.removeListener('streamsChanged', this.onStreamChange);
    }

    window.removeEventListener('resize', this.onResize);
    this.terminal.destroy();
  }

  onStreamChange() {
    const process = this.props.process;

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

    const { clientWidth: parentWidth, clientHeight: parentHeight } = this.container;
    const { clientWidth, clientHeight, offsetWidth, offsetHeight, scrollWidth, scrollHeight } = this.terminal.element;

    const x = (parentWidth - (offsetWidth - clientWidth)) / scrollWidth;
    const y = (parentHeight - (offsetHeight - clientHeight)) / scrollHeight;

    let cols = x * this.terminal.cols | 0;
    let rows = y * this.terminal.rows | 0;

    const geometry = this.proposeGeometry();
    cols = geometry.cols;
    rows = geometry.rows;

    if (this.terminal.cols !== cols || this.terminal.rows !== rows) {
      this.terminal.resize(cols, rows);
      if (this.props.onResize) {
        this.props.onResize(cols, rows);
      }
    }
  }

  /**
   * Some calculation for resizing the terminal. Fixes the height props introduced in version prior to 0.2.4
   * @returns {Object} - rows and cols object
   */
  proposeGeometry () {
    const parentElementStyle = window.getComputedStyle(this.terminal.element.parentElement);
    const parentElementHeight = parseInt(parentElementStyle.getPropertyValue('height'));
    const parentElementWidth = Math.max(0, parseInt(parentElementStyle.getPropertyValue('width')) - 17);
    const elementStyle = window.getComputedStyle(this.terminal.element);
    const elementPaddingVer = parseInt(elementStyle.getPropertyValue('padding-top')) + parseInt(elementStyle.getPropertyValue('padding-bottom'));
    const elementPaddingHor = parseInt(elementStyle.getPropertyValue('padding-right')) + parseInt(elementStyle.getPropertyValue('padding-left'));
    const availableHeight = parentElementHeight - elementPaddingVer;
    const availableWidth = parentElementWidth - elementPaddingHor;
    const subjectRow = this.terminal.rowContainer.firstElementChild;
    const contentBuffer = subjectRow.innerHTML;
    let characterHeight;
    let rows;
    let characterWidth;
    let cols;
    let geometry;

    subjectRow.style.display = 'inline';
    subjectRow.innerHTML = 'W'; // Common character for measuring width, although on monospace
    characterWidth = subjectRow.getBoundingClientRect().width;
    subjectRow.style.display = ''; // Revert style before calculating height, since they differ.
    characterHeight = parseInt(subjectRow.offsetHeight);
    subjectRow.innerHTML = contentBuffer;

    rows = parseInt(availableHeight / characterHeight);
    cols = parseInt(availableWidth / characterWidth);

    geometry = {cols: cols, rows: rows};
    return geometry;
  }

  render() {
    let style = {
      fontFamily: this.props.fontFamily,
      fontSize: this.props.fontSize
    };

    return <div className="terminal-wrapper" hidden={this.props.hidden}><div style={style} className="terminal-container" hidden={this.props.hidden} ref={div => this.container = div}/></div>;
  }
}
