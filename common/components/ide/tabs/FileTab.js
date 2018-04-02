import React from 'react';

import Icon from '../../Icon';
import Tab from './Tab';
import { InputBox } from '../../InputBox';

export default class FileTab extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeAnnotation = this.onChangeAnnotation.bind(this);
    this.onChangeNameEditable = this.onChangeNameEditable.bind(this);

    this.handleRename = this.handleRename.bind(this);
    this.onRename = this.onRename.bind(this);
    this.onRenameBlur = this.onRenameBlur.bind(this);
    this.onEnterRename = this.onEnterRename.bind(this);
    this.onHasChangesUpdate = this.onHasChangesUpdate.bind(this);

    this.state = {};
  }

  componentDidMount() {
    const item = this.props.item;

    item.on('changeName', this.onChangeName);
    item.on('changeAnnotation', this.onChangeAnnotation);
    item.on('changeNameEditable', this.onChangeNameEditable);
    item.on('hasChangesUpdate', this.onHasChangesUpdate);

    this.onChangeName();
    this.onChangeAnnotation();
    this.onChangeNameEditable();
    this.onHasChangesUpdate();
  }

  componentWillUnmount() {
    const item = this.props.item;

    item.removeListener('changeName', this.onChangeName);
    item.removeListener('changeAnnotation', this.onChangeAnnotation);
    item.removeListener('changeNameEditable', this.onChangeNameEditable);
    item.removeListener('hasChangesUpdate', this.onHasChangesUpdate);
  }

  onChangeNameEditable() {
    this.setState({
      isNameEditable: this.props.item.isNameEditable()
    });
  }

  onChangeName() {
    this.setState({
      name: this.props.item.getName()
    });
  }

  onChangeAnnotation() {
    const annotations = this.props.item.annotations;

    const types = [null, 'Info', 'Warning', 'Error'];
    let worst = 0;

    annotations.forEach(annotation => {
      const index = types.indexOf(annotation.type, 1);
      worst = Math.max(worst, index);
    });

    this.setState({
      annotationLevel: types[worst],
      annotationCount: annotations.length
    });
  }

  onHasChangesUpdate() {
    this.setState({
      hasChanges: this.props.item.hasChanges
    });
  }

  /**
   * Receives name changes from the InputBox
   * @param {string} value - new name
   *
   * @returns {void}
   */
  onRename(value) {
    this.props.item.setName(value);
  }

  onEnterRename(keyCode, charCode, key) {
    const isEnter = keyCode === 13 || charCode === 13 || key === 'Enter';
    if (isEnter) {
      this.props.item.setNameEdtiable(false);
    }
  }

  onRenameBlur() {
    this.props.item.setNameEdtiable(false);
  }

  /**
   * Start file renaming
   * @param {Event} e - rename event
   * @returns {void}
   */
  handleRename(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    this.props.item.setNameEdtiable.call(this.props.item, true);
  }

  renderAnnotations() {
    let {annotationLevel, annotationCount} = this.state;

    if (annotationCount) {
      if (annotationLevel == null) {
        annotationLevel = 'danger';
      }

      annotationLevel = annotationLevel.replace('Error', 'danger');

      let icon = 'exclamation-triangle';

      if (annotationLevel === 'Info') {
        icon = 'info-circle';
      }

      return (
        <Icon
          name={icon}
          title={`${annotationCount} Problem${annotationCount > 1 ? 'e' : ''} in dieser Datei`}
          className={annotationLevel}
        />
      );
    }

    return null;
  }

  renderNameOrInput() {
    if (this.state.isNameEditable) {
      return (
        <div className="file-rename-wrapper">
          <InputBox type="text" autoSelect={true} onBlur={this.onRenameBlur} onKeyPress={this.onEnterRename} onChange={this.onRename} value={this.state.name} />
        </div>
      );
    } else {
      return this.state.name;
    }
  }

  render() {
    return (
      <Tab {...this.props} icon="file" draggable={false} onPress={this.handleRename} showDotIndicator={this.state.hasChanges}>
        <span onDoubleClick={this.handleRename}>{this.renderNameOrInput()}</span> {this.renderAnnotations()}
      </Tab>
    );
  }
}
