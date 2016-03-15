import React from 'react';
import Ace, {EditSession} from 'ace';

import Sourcebox from '@sourcebox/web';

import TabBar from './tabs';
import Editor from './editor';
import Options from './options';
import Terminal from './terminal';

let c = `
#include <stdio.h>

int main() {
    puts("Hello, World!");
    return 0;
}
`.trim();

let initialState = {
  files: [
    {
      name: 'test.c',
      session: new EditSession(c, 'ace/mode/c_cpp')
    }
  ],
  terminals: [],
  active: {
    type: 'none',
    index: 0
  },
  options: {
    theme: 'ace/theme/clouds',
    fontSize: 12,
    showInvisibles: false,
    highlightActiveLine: true,
    showPrintMargin: false
  }
};

let modelist = Ace.require('ace/ext/modelist');

class Content extends React.Component {
  renderTerminals() {
    let {terminals, active} = this.props;

    return terminals.map((terminal, index) => {
      let current = active.type === 'terminal' && index === active.index;

      return (
        <Terminal
          key={'terminal' + index}
          stream={terminal.process.stdin}
          onTitle={this.props.onTerminalTitle.bind(null, index)}
          hidden={!current}
        />
      );
    });
  }

  render() {
    let session;

    if (this.props.active.type === 'file'){
      session = this.props.files[this.props.active.index].session;
    }

    return (
      <div className="content">
        <Editor {...this.props.options} session={session} hidden={this.props.active.type !== 'file'}/>
        {this.renderTerminals()}
      </div>
    );
  }
}

export default class Ide extends React.Component {
  constructor(props) {
    super(props);

    this.state = initialState;
    this.sourcebox = new Sourcebox('http://52.58.54.59/', {
      auth: 'eyJhbGciOiJIUzI1NiJ9.Zm9v.opx1-KK6j1FQ5cM3YOv3dZOeSxzt3OlfkP4kr4pM5bA'
    });
  }

  onNewFile(name) {
    let files = this.state.files;

    var file = {
      name,
      session: new EditSession('', modelist.getModeForPath(name).mode)
    };

    let index = files.push(file) - 1;

    this.setState({
      files,
      active: {
        type: 'file',
        index
      }
    });
  }

  onNewTerminal() {
    let terminals = this.state.terminals;

    var process = this.sourcebox.exec('bash', {
      term: true
    });

    let index = terminals.push({
      name: 'Terminal',
      process
    }) - 1;

    this.setState({
      terminals,
      active: {
        type: 'terminal',
        index
      }
    });
  }

  onTerminalTitle(index, title) {
    let terminals = this.state.terminals;
    terminals[index].name = title;
    this.setState({ terminals });
  }

  onChangeTab(type, index) {
    this.setState({
      active: { type, index }
    });
  }

  onOptions(name, value) {
    let state  = this.state;
    state.options[name] = value;

    state.options.fontSize = +state.options.fontSize;

    this.setState(state);
  }

  render() {
    return (
      <div className="card ide">
        <div className="card-header">
          <TabBar
            files={this.state.files}
            terminals={this.state.terminals}
            active={this.state.active}
            onNewFile={this.onNewFile.bind(this)}
            onNewTerminal={this.onNewTerminal.bind(this)}
            onChange={this.onChangeTab.bind(this)}
          />
        </div>
        <Content {...this.state} onTerminalTitle={this.onTerminalTitle.bind(this)}/>
      </div>
    );
  }
}


