import React from 'react';

import Terminal from '../Terminal';
import optionManager from '../../../models/options';

const bell = new Audio('/public/audio/bell.ogg');

export default class ProcessPanel extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeOption = this.onChangeOption.bind(this);

    this.onBell = this.onBell.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onTitle = this.onTitle.bind(this);
  }

  componentWillMount() {
    optionManager.on('change', this.onChangeOption);
    this.onChangeOption();
  }

  componentWillUnmount() {
    optionManager.removeListener('change', this.onChangeOption);
  }

  onChangeOption() {
    this.setState({
      options: optionManager.getOptions()
    });
  }

  onResize(cols, rows) {
    let process = this.props.item;
    process.resize(cols, rows);
  }

  onTitle(title) {
    this.props.item.emit('title', title);
  }

  onBell() {
    if (this.state.options.terminal.audibleBell) {
      if (bell.paused) {
        bell.play();
      } else {
        bell.currentTime = 0;
      }
    }

    this.props.item.emit('bell');
  }

  render() {
    let process = this.props.item;
    let {font, fontSize} = this.state.options;

    return (
      <Terminal
        fontFamily={`${font}, monospace`}
        fontSize={`${fontSize}pt`}
        stdin={process.stdin}
        stdout={process.stdout}
        stderr={process.stderr}
        onBell={this.onBell}
        onResize={this.onResize}
        onTitle={this.onTitle}
        hidden={!this.props.active}
      />
    );
  }
}

ProcessPanel.renderInactive = true;
