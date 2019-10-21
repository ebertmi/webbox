import React, { PureComponent } from 'react';

import { addCodeEmbedCell, addMarkdownCell, addRawCell, addCodeCell, addNewCell } from '../../actions/NotebookActions';
import Icon from '../Icon';
import { Toolbar, ActionItem } from '../Toolbar';

export default class AddControls extends PureComponent {

  constructor(props) {
    super(props);
    this.onAddCodeEmbedCell = this.onAddCodeEmbedCell.bind(this);
    this.onAddMarkdownCell = this.onAddMarkdownCell.bind(this);
    this.onAddRawCell = this.onAddRawCell.bind(this);
    this.onAddCodeCell = this.onAddCodeCell.bind(this);
    this.onAddNewCell = this.onAddNewCell.bind(this);
  }

  onAddCodeEmbedCell() {
    this.props.dispatch(addCodeEmbedCell(this.props.cellIndex));
  }

  onAddCodeCell() {
    this.props.dispatch(addCodeCell(this.props.cellIndex));
  }

  onAddMarkdownCell() {
    this.props.dispatch(addMarkdownCell(this.props.cellIndex));
  }

  onAddRawCell() {
    this.props.dispatch(addRawCell(this.props.cellIndex));
  }

  onAddNewCell() {
    this.props.dispatch(addNewCell(this.props.cellIndex));
  }

  render() {
    const { isEditModeActive } = this.props;
    if (!isEditModeActive) {
      return null;
    }
    return (
      <div className="add-controls col-12">
        <Toolbar className="notebook-toolbar">
          <ActionItem isIcon={true} title="Neuer Textabschnitt" onClick={this.addMarkdownCell}>
            <Icon name="file-text-o" className="icon-control" />
          </ActionItem>
          <ActionItem isIcon={true} title="Neues Code-Beispiel (IDE)" onClick={this.onAddCodeEmbedCell} >
            <Icon name="file-code-o" className="icon-control" />
          </ActionItem>
          <ActionItem isIcon={true} title="Neuer Code-Block" onClick={this.onAddCodeCell} >
            <Icon name="terminal" className="icon-control" />
          </ActionItem>
          <ActionItem isIcon={true} title="Neuer HTML-Block (Raw)" onClick={this.onAddRawCell} >
            <Icon name="code" className="icon-control" />
          </ActionItem>
          <ActionItem isIcon={true} title="Neuer New-Cell Block" onClick={this.onAddNewCell} >
            <Icon name="star" className="icon-control" />
          </ActionItem>
        </Toolbar>
      </div>
    );
  }
}