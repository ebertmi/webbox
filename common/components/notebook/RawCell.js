import React from 'react';
import CellMetadata from './CellMetadata';
import Editor from '../Editor';
import { EditButtonGroup } from './EditButtonGroup';
import { editCell, deleteCell, stopEditCell, updateCell, moveCellUp, moveCellDown } from '../../actions/NotebookActions';
import { EditSession } from 'ace';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class RawCell extends React.Component {
  constructor(props) {
    super(props);

    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onStopEdit = this.onStopEdit.bind(this);
    this.onUpdateCell = this.onUpdateCell.bind(this);
    this.onCellUp = this.onCellUp.bind(this);
    this.onCellDown = this.onCellDown.bind(this);
  }

  componentDidMount() {
  }

  onCellUp() {
    this.props.dispatch(moveCellUp(this.props.cell.get('id')));
  }

  onCellDown() {
    this.props.dispatch(moveCellDown(this.props.cell.get('id')));
  }

  onEdit(e) {
    e.preventDefault();
    this.props.dispatch(editCell(this.props.cell.get('id')));
  }

  onDelete(e) {
    e.preventDefault();
    this.props.dispatch(deleteCell(this.props.cell.get('id')));
  }

  onStopEdit(e) {
    e.preventDefault();
    this.props.dispatch(stopEditCell());
    this.onUpdateCell();
  }

  /**
   * Saves the "source" property of a cell.
   */
  onUpdateCell() {
    if (this.session) {
      let content = this.session.getValue();
      this.props.dispatch(updateCell(this.props.cell.get('id'), content));
    } else {
      console.warn('RawCell.onSaveCellSource called with invalid session', this.session);
    }
  }

  /**
   * Helper to determine the height of the rendered raw content to set the ace editor size accordingly
   */
  getWrapperHeightOrMin() {
    if (this.wrapperNode) {
      return Math.max(this.wrapperNode.offsetHeight,  this.wrapperNode.scrollHeight,  this.wrapperNode.clientHeight, this.props.minHeight);
    } else {
      return this.props.minHeight;
    }
  }

  renderEditMode() {
    let minHeight = this.getWrapperHeightOrMin();
    let source = this.props.cell.get('source');
    this.session = new EditSession(source, 'ace/mode/markdown');
    return (
      <div>
        <strong>Raw</strong>
        <Editor onBlur={this.onStopEdit} minHeight={minHeight} maxLines={100} session={this.session} ref={editor => this.editor = editor} />
      </div>
    );
  }

  renderViewMode() {
    // ToDo: maybe limit the size of the cell?
    let format = this.props.cell.getIn(['metadata', 'format']);

    switch(format) {
      case 'text/plain':
        return <div ref={this.onRef}><pre>{this.props.cell.get('source')}</pre></div>;
      case 'text/html':
        return <div ref={this.onRef} dangerouslySetInnerHTML={{__html: this.props.cell.get('source')}}></div>;
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        return <img ref={this.onRef} src={this.props.cell.get('source')} />;
      default:
        return <p>Nicht unterstütztes Format für diese Zelle (siehe Metadaten unter "format").</p>;
    }
  }

  render() {
    const { cell, isAuthor, editing, dispatch } = this.props;
    let content;
    let metadata = <CellMetadata dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />;
    let editingClass = editing ? ' editing' : '';

    if (!(isAuthor && editing)) {
      content = this.renderViewMode();
    } else {
      content = this.renderEditMode();
    }

    return (
      <div className={"raw-cell" + editingClass}>
        <EditButtonGroup editing={editing} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        {content}
      </div>
    );
  }
}
