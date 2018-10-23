import React from 'react';
import PropTypes from 'prop-types';
//import { EditSession, UndoManager } from 'ace';
import classnames from 'classnames';

import BaseCell from './BaseCell';
import CellMetadata from './CellMetadata';
import Editor from '../Editor';
import { EditButtonGroup } from './EditButtonGroup';
import optionManager from '../../models/options';
import { createModel, setMode  } from '../../util/monacoUtils';

import { updateCell } from '../../actions/NotebookActions';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class RawCell extends BaseCell {
  constructor(props) {
    super(props);

    this.onUpdateCell = this.onUpdateCell.bind(this);

    this.state = {
      options: optionManager.getOptions()
    };
  }

  componentDidMount() {
    optionManager.on('change', this.onChangeOption);
  }

  componentWillUnmount() {
    optionManager.removeListener('change', this.onChangeOption);
  }

  /**
   * Saves the "source" property of a cell.
   */
  onUpdateCell(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (this.model) {
      const content = this.model.getValue();
      this.props.dispatch(updateCell(this.props.cell.get('id'), content));
    }
  }

  onChangeOption() {
    this.setState({
      options: optionManager.getOptions()
    });
  }

  /**
   * Helper to determine the height of the rendered raw content to set the ace editor size accordingly
   */
  getWrapperHeightOrMin() {
    if (this.wrapperNode) {
      return Math.max(this.wrapperNode.offsetHeight, this.wrapperNode.scrollHeight, this.wrapperNode.clientHeight, this.props.minHeight);
    } else {
      return this.props.minHeight;
    }
  }

  renderEditMode() {
    const minHeight = this.getWrapperHeightOrMin();
    let source = this.getSourceFromCell();

    if (source == null) {
      source = '';
    }

    // Get default language from notebook if mode is not available
    const mode = this.props.cell.getIn(['metadata', 'mode'], 'html');

    if (this.model) {
      this.model.setValue(source);
      setMode(this.model, mode);
    } else {
      this.model = createModel('temp', source, mode);
    }

    return (
      <div className="col-12" onKeyDown={this.onKeyDown}>
        <p className="text-muted">
          Es werden folgende Formate unterstützt: <code>text/plain</code>, <code>text/html</code>, <code>image/(jpeg|png|gif)</code>.
        </p>
        <strong>Raw</strong>
        <Editor
          fontSize="1.3rem"
          minHeight={minHeight}
          options={this.state.options}
          file={{model: this.model}}
          ref={editor => this.editor = editor} 
        />
      </div>
    );
  }

  renderViewMode() {
    const format = this.props.cell.getIn(['metadata', 'format']);
    const source = this.getSourceFromCell();

    switch (format) {
      case 'text/plain':
        return <div className="col-12" ref={this.onRef}><pre>{source}</pre></div>;
      case 'text/html':
        return <div className="col-12" ref={this.onRef} dangerouslySetInnerHTML={{__html: source}}></div>;
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        return <div className="col-12"><img ref={this.onRef} src={source} /></div>;
      default:
        return <p>Nicht unterstütztes Format für diese Zelle (siehe Metadaten unter "format").</p>;
    }
  }

  render() {
    const { cell, isEditModeActive, editing, dispatch } = this.props;
    let content;
    const metadata = <CellMetadata beforeChange={this.onUpdateCell} className="col-12" dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />;
    const editingClass = editing ? ' editing' : '';
    const isVisible = this.isVisible();

    if (!(isEditModeActive && editing)) {
      content = this.renderViewMode();
    } else {
      content = this.renderEditMode();
    }

    const classes = classnames('raw-cell col-12 row', editingClass, {
      'cell-not-visible': !isVisible
    });

    return (
      <div className={classes}>
        <EditButtonGroup isVisible={isVisible} isEditModeActive={isEditModeActive} editing={editing} onToggleVisibility={this.onToggleVisibility} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        {content}
      </div>
    );
  }
}

RawCell.propTypes = {
  minHeight: PropTypes.number,
  cell: PropTypes.object.isRequired,
  isEditModeActive: PropTypes.bool.isRequired,
  editing: PropTypes.bool.isRequired,
  cellIndex: PropTypes.number.isRequired
};

RawCell.defaultProps = {
  minHeight: 200
};