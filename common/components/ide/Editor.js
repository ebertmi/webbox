import React from 'react';
import Ace from 'ace';

// "dumb" editor component

export default class Editor extends React.Component {
  componentDidMount() {
    this.editor = Ace.edit(this.container);
    this.updateProps(this.props);
  }

  componentWillUnmount() {
    this.editor.setSession();
    this.editor.destroy();
  }

  componentWillReceiveProps(next) {
    this.updateProps(next);
  }

  componentDidUpdate() {
    this.editor.resize();
  }

  updateProps(props) {
    let {session, ...options} = props;

    if (session) {
      this.editor.setSession(props.session);
    }

    this.editor.setOptions(options);
  }

  focus() {
    this.editor.focus();
  }

  render() {
    return <div ref={div => this.container = div}/>;
  }

}
