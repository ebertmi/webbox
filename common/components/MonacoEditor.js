import React from 'react';
import Ace from 'ace';

// "dumb" editor component

export default class Editor extends React.Component {
  componentDidMount() {
    this.editor = Ace.edit(this.container);
    this.editor.$blockScrolling = Infinity;
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
    let {onBlur, minHeight, session, ...options} = props;

    if (session) {
      this.editor.setSession(props.session);
    }

    this.editor.setOptions(options);

    if (Ace.config.$defaultOptions.editor.enableBasicAutocompletion == null) {
      Ace.config.loadModule('ace/ext/language_tools', () => {
        this.editor.setOptions(options);
      });
    }

  }

  focus() {
    this.editor.focus();
  }

  render() {
    const styles = {};
    if (this.props.minHeight) {
      styles.minHeight = this.props.minHeight;
    }
    return <div onBlur={this.props.onBlur} style={styles} ref={div => this.container = div}/>;
  }

}
