import React from 'react';
import { EditSession, UndoManager } from 'ace';
import classnames from 'classnames';

import BaseCell from './BaseCell';
import CellMetadata from './CellMetadata';
import Editor from '../Editor';
import { EditButtonGroup } from './EditButtonGroup';

import { updateCell } from '../../actions/NotebookActions';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class RawCell extends BaseCell {
  constructor(props) {
    super(props);

    this.onUpdateCell = this.onUpdateCell.bind(this);
  }

  componentDidMount() {
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
    let source = this.getSourceFromCell();

    if (source == null) {
      source = '';
    }

    let mode = this.props.cell.getIn(['metadata', 'mode'], 'ace/mode/html');

    if (this.session) {
      this.session.setValue(source);
      this.session.setMode(mode);
    } else {
      this.session = new EditSession(source, mode);
      this.session.setUndoManager(new UndoManager);
    }

    return (
      <div className="col-xs-12" onKeyDown={this.onKeyDown}>
        <p className="text-muted">
          Es werden folgende Formate unterstützt: <code>text/plain</code>, <code>text/html</code>, <code>image/(jpeg|png|gif)</code>.
        </p>
        <strong>Raw</strong>
        <Editor fontSize="13px" minHeight={minHeight} maxLines={100} session={this.session} ref={editor => this.editor = editor} />
      </div>
    );
  }

  renderViewMode() {
    // ToDo: maybe limit the size of the cell?
    let format = this.props.cell.getIn(['metadata', 'format']);
    let source = this.getSourceFromCell();

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
    const isVisible = this.isVisible();

    if (!(isAuthor && editing)) {
      content = this.renderViewMode();
    } else {
      content = this.renderEditMode();
    }

    const classes = classnames("raw-cell col-md-12 row", editingClass, {
      'cell-not-visible': !isVisible
    });

    return (
      <div className={classes}>
        <EditButtonGroup isVisible={isVisible} isAuthor={isAuthor} editing={editing} onToggleVisibility={this.onToggleVisibility} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
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