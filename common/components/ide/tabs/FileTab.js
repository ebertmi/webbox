import React from  'react';

import Icon from '../../Icon';
import Tab from './Tab';

export default class FileTab extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeAnnotation = this.onChangeAnnotation.bind(this);
  }

  componentWillMount() {
    let item = this.props.item;

    item.on('changeName', this.onChangeName);
    item.on('changeAnnotation', this.onChangeAnnotation);

    this.onChangeName();
    this.onChangeAnnotation();
  }

  componentWillUnmount() {
    let item = this.props.item;

    item.removeListener('changeName', this.onChangeName);
    item.removeListener('changeAnnotation', this.onChangeAnnotation);
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

  render() {
    return (
      <Tab {...this.props} icon="file">
        {this.state.name} {this.renderAnnotations()}
      </Tab>
    );
  }
}
