import React from 'react';
import Ace from 'ace';

export default class Editor extends React.Component {
  componentDidMount() {
    this.editor = Ace.edit(this.container);
    this.updateProps(this.props);
  }

  componentWillUnmount() {
    this.editor.destroy();
  }

  componentWillReceiveProps(next) {
    this.updateProps(next);
  }

  updateProps(props) {
    let {session, ...options} = props;

    if (session) {
      this.editor.setSession(props.session);
    }

    this.editor.setOptions(options);
  }

  render() {
    return <div ref={div => this.container = div} hidden={this.props.hidden}/>;
  }

}
