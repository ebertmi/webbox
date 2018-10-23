import React from 'react';

import Editor from '../../Editor';
import optionManager from '../../../models/options';
import { Button } from '../../bootstrap';

export default class TestAuthoringPanel extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeOption = this.onChangeOption.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onSave = this.onSave.bind(this);

    // Initial state
    this.state = {
      options: optionManager.getEditorOptions()
    };
  }

  componentDidMount() {
    this.editor.focus();

    this.props.item.on('change', this.onChange);
    optionManager.on('change', this.onChangeOption);
    this.onChangeOption();
  }

  componentWillUnmount() {
    this.props.item.removeListener('change', this.onChange);
    optionManager.removeListener('change', this.onChangeOption);
  }

  onChange() {

  }

  onChangeOption() {
    this.setState({
      options: optionManager.getEditorOptions()
    });
  }

  onSave(e) {
    e.preventDefault();

    this.props.item.saveTests();
  }

  render() {
    let file = this.props.item.getTestCode();
    if (file == null) {
      file = this.props.item.createTestCode();
    }

    return (
      <div className="tests-panel" onSubmit={e => e.preventDefault()}>
        <h3>Tests</h3>
        <div>
          <p className="text-muted">Hier können Sie die Unit-Tests bearbeiten. Bitte benutzen Sie das jeweilige Template für die Programmiersprache.</p>
          <Button bsStyle="success" className="form-group" onClick={this.onSave}>Speichern</Button>
        </div>
        <hr />
        <Editor
          options={this.state.options}
          file={file}
          ref={editor => {this.editor = editor;}}
        />
      </div>
    );
  }
}
