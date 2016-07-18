import React, { Component } from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';

import { addCodeEmbedCell, addMarkdownCell, addRawCell, addCodeCell } from '../../actions/NotebookActions';
import Icon from '../Icon';

export default class AddControls extends Component {

  constructor(props) {
    super(props);
    this.addCodeEmbedCell = this.addCodeEmbedCell.bind(this);
    this.addMarkdownCell = this.addMarkdownCell.bind(this);
    this.addRawCell = this.addRawCell.bind(this);
    this.addCodeCell = this.addCodeCell.bind(this);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  addCodeEmbedCell() {
    this.props.dispatch(addCodeEmbedCell(this.props.cellIndex));
  }

  addCodeCell() {
    this.props.dispatch(addCodeCell(this.props.cellIndex));
  }


  addMarkdownCell() {
    this.props.dispatch(addMarkdownCell(this.props.cellIndex));
  }

  addRawCell() {
    this.props.dispatch(addRawCell(this.props.cellIndex));
  }

  render() {
    const { isAuthor } = this.props;
    if (!isAuthor) {
      return null;
    }
    return (
      <div className="add-controls col-md-12">
        <Icon name="file-text-o" className="icon-control" onClick={this.addMarkdownCell} title="Neuer Textabschnitt" />
        <Icon name="file-code-o" className="icon-control" onClick={this.addCodeEmbedCell} title="Neues Code-Beispiel (IDE)" />
        <Icon name="terminal" className="icon-control" onClick={this.addCodeCell} title="Neuer Code-Block" />
        <Icon name="code" className="icon-control" onClick={this.addRawCell} title="Neuer HTML-Block" />
      </div>
    );
  }

}