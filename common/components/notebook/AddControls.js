import React, { Component } from 'react';
import { addCodeEmbedCell, addMarkdownCell, addRawCell } from '../../actions/NotebookActions';
import Icon from '../Icon';

export default class AddControls extends Component {

  constructor(props) {
    super(props);
    this.addCodeEmbedCell = this.addCodeEmbedCell.bind(this);
    this.addMarkdownCell = this.addMarkdownCell.bind(this);
    this.addRawCell = this.addRawCell.bind(this);
  }

  addCodeEmbedCell() {
    this.props.dispatch(addCodeEmbedCell(this.props.id));
  }

  addMarkdownCell() {
    this.props.dispatch(addMarkdownCell(this.props.id));
  }

  addRawCell() {
    this.props.dispatch(addRawCell(this.props.id));
  }

  render() {
    const { isAuthor } = this.props;
    if (!isAuthor) {
      return null;
    }
    return (
      <div className="add-controls">
        <Icon name="file-text-o" className="icon-control" onClick={this.addMarkdownCell} title="Neuer Textabschnitt" />
        <Icon name="file-code-o" className="icon-control" onClick={this.addCodeEmbedCell} title="Neuer Code-Block/Embed" />
        <Icon name="code" className="icon-control" onClick={this.addRawCell} title="Neuer HTML-Block" />
      </div>
    );
  }

}