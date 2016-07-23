import React from 'react';

import Editor from '../../Editor';
import optionManager from '../../../models/options';

const FIXED_OPTIONS = {
  showPrintMargin: false
};

export default class FilePanel extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeOption = this.onChangeOption.bind(this);
  }

  componentWillMount() {
    optionManager.on('change', this.onChangeOption);
    this.onChangeOption();
  }

  componentDidMount() {
    this.editor.focus();
  }

  componentWillUnmount() {
    optionManager.removeListener('change', this.onChangeOption);
  }

  onChangeOption() {
    this.setState({
      options: optionManager.getOptions()
    });
  }

  render() {
    let file = this.props.item;
    let {font, fontSize, ace: aceOptions} = this.state.options;
    // TODO read only files

    return (
      <Editor
        fontFamily={`${font}, monospace`}
        fontSize={`${fontSize}pt`}
        {...aceOptions}
        {...FIXED_OPTIONS}
        session={file}
        ref={editor => this.editor = editor}
      />
    );
  }
}
