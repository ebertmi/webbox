import React from 'react';
import Term from 'term.js';

import capitalize from 'lodash/capitalize';
import debounce from 'lodash/debounce';

const events = [
  'data', 'end', 'finish',
  'title', 'bell', 'destroy'
];

export default class Terminal extends React.Component {
  constructor(props) {
    super(props);

    this.onResize = debounce(this.onResize.bind(this), 100, true);
  }

  componentDidMount() {
    this.terminal = new Term({
      useStyle: false
    });

    this.terminal.open(this.container);

    window.addEventListener('resize', this.onResize);

    let {stdin, stdout, stderr} = this.props;

    if (stdin) {
      this.terminal.pipe(stdin);
    }

    if (stdout) {
      stdout.setEncoding('utf8');
      stdout.pipe(this.terminal, {
        end: false
      });
    }

    if (stderr && stderr !== stdout) {
      stderr.setEncoding('utf8');
      stderr.pipe(this.terminal, {
        end: false
      });
    }

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
  }

  render() {
    let style = {
      fontFamily: this.props.fontFamily,
      fontSize: this.props.fontSize
    };

    return <div style={style} className="terminal-container" hidden={this.props.hidden} ref={div => this.container = div}/>;
  }
}
