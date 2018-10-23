import React from 'react';

import Editor from '../../Editor';
import optionManager from '../../../models/options';


export default class FilePanel extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeOption = this.onChangeOption.bind(this);

    this.state = {
      options: optionManager.getEditorOptions()
    };
  }

  componentDidMount() {
    //this.editor.focus();
    optionManager.on('change', this.onChangeOption);
  }

  componentWillUnmount() {
    optionManager.removeListener('change', this.onChangeOption);
  }

  onChangeOption() {
    this.setState({
      options: optionManager.getEditorOptions()
    });
  }

  render() {
    let file = this.props.item;
    // TODO read only files

    return (
      <Editor
        options={this.state.options}
        file={file}
        ref={editor => { this.editor = editor; }}
      />
    );
  }
}
