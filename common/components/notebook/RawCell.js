import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import { EditSession, UndoManager } from 'ace';

import CellMetadata from './CellMetadata';
import Editor from '../Editor';
import { EditButtonGroup } from './EditButtonGroup';

import { editCell, deleteCell, stopEditCell, updateCell, moveCellUp, moveCellDown } from '../../actions/NotebookActions';
import { sourceFromCell } from '../../util/nbUtil';

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
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  componentDidMount() {
  }

  onCellUp() {
    this.props.dispatch(moveCellUp(this.props.cellIndex));
  }

  onCellDown() {
    this.props.dispatch(moveCellDown(this.props.cellIndex));
  }

  onEdit(e) {
    e.preventDefault();
    this.props.dispatch(editCell(this.props.cellIndex));
  }

  onDelete(e) {
    e.preventDefault();
    this.props.dispatch(deleteCell(this.props.cellIndex));
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
    let source = sourceFromCell(this.props.cell);
    let mode = this.cell.getIn(['metadata', 'mode'], 'ace/mode/markdown');

    if (this.session) {
      this.session.setValue(source);
      this.session.setMode(mode);
    } else {
      this.session = new EditSession(source, mode || 'ace/mode/markdown');
      this.session.setUndoManager(new UndoManager);
    }

    return (
      <div>
        <strong>Raw</strong>
        <Editor minHeight={minHeight} maxLines={100} session={this.session} ref={editor => this.editor = editor} />
      </div>
    );
  }

  renderViewMode() {
    // ToDo: maybe limit the size of the cell?
    let format = this.props.cell.getIn(['metadata', 'format']);
    let source = sourceFromCell(this.props.cell);

    switch(format) {
      case 'text/plain':
        return <div className="col-xs-12" ref={this.onRef}><pre>{source}</pre></div>;
      case 'text/html':
        return <div className="col-xs-12" ref={this.onRef} dangerouslySetInnerHTML={{__html: source}}></div>;
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        return <div className="col-xs-12"><img ref={this.onRef} src={source} /></div>;
      default:
        return <p>Nicht unterstütztes Format für diese Zelle (siehe Metadaten unter "format").</p>;
    }
  }

  render() {
    const { cell, isAuthor, editing, dispatch } = this.props;
    let content;
    let metadata = <CellMetadata className="col-xs-12" dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />;
    let editingClass = editing ? ' editing' : '';

    if (!(isAuthor && editing)) {
      content = this.renderViewMode();
    } else {
      content = this.renderEditMode();
    }

    return (
      <div className={"raw-cell col-md-12 row " + editingClass}>
        <EditButtonGroup  isAuthor={isAuthor} editing={editing} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        {content}
      </div>
    );
  }
}

RawCell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  isAuthor: React.PropTypes.bool.isRequired,
  editing: React.PropTypes.bool.isRequired,
  cellIndex: React.PropTypes.number.isRequired
};