import React from  'react';

import Icon from '../../Icon';
import Tab from './Tab';
import { InputBox } from '../../InputBox';

export default class FileTab extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeAnnotation = this.onChangeAnnotation.bind(this);
    this.onChangeNameEditable = this.onChangeNameEditable.bind(this);
  }

  componentWillMount() {
    let item = this.props.item;

    item.on('changeName', this.onChangeName);
    item.on('changeAnnotation', this.onChangeAnnotation);
    item.on('changeNameEditable', this.onChangeNameEditable);

    this.onChangeName();
    this.onChangeAnnotation();
    this.onChangeNameEditable();
  }

  componentWillUnmount() {
    let item = this.props.item;

    item.removeListener('changeName', this.onChangeName);
    item.removeListener('changeAnnotation', this.onChangeAnnotation);
    item.removeListener('changeNameEditable', this.onChangeNameEditable);
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
    let annotations = this.props.item.getAnnotations();

    const types = [null, 'info', 'warning', 'error'];
    let worst = 0;

    annotations.forEach(annotation => {
      let index = types.indexOf(annotation.type, 1);
      worst = Math.max(worst, index);
    });

    this.setState({
      annotationLevel: types[worst],
      annotationCount: annotations.length
    });
  }

  /**
   * Receives name changes from the InputBox
   */
  onRename(value) {
    this.props.item.setName(value);
  }

  /**
   * Start file renaming
   */
  handleRename(e) {
    e.preventDefault();

    this.props.item.setNameEdtiable.call(this.props.item, true);
  }

  onEnterRename(keyCode, charCode, key) {
    const isEnter = keyCode === 13 || charCode === 13 || key === "Enter";
    if (isEnter) {
      this.props.item.setNameEdtiable(false);
    }
  }

  onRenameBlur() {
    this.props.item.setNameEdtiable(false);
  }

  renderAnnotations() {
    let {annotationLevel, annotationCount} = this.state;

    if (annotationCount) {
      annotationLevel = annotationLevel.replace('error', 'danger');

      let icon = 'exclamation-triangle';

      if (annotationLevel === 'info') {
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
  }

  renderNameOrInput() {
    if (this.state.isNameEditable) {
      return (
        <div className="file-rename-wrapper">
          <InputBox type="text" autoSelect={true} onBlur={this.onRenameBlur.bind(this)} onKeyPress={this.onEnterRename.bind(this)} onChange={this.onRename.bind(this)} value={this.state.name} />
        </div>
      );
    } else {
      return this.state.name;
    }
  }

  render() {
    return (
      <Tab {...this.props} icon="file" draggable={false}>
        <span onDoubleClick={this.handleRename.bind(this)}>{this.renderNameOrInput()}</span> {this.renderAnnotations()}
      </Tab>
    );
  }
}