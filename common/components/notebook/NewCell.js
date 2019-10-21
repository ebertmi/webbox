import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import BaseCell from './BaseCell';
import CellMetadata from './CellMetadata';
import Editor from '../Editor';
import { EditButtonGroup } from './EditButtonGroup';
import optionManager from '../../models/options';
import { createModel, setMode } from '../../util/monacoUtils';

import { updateCell } from '../../actions/NotebookActions';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class NewCell extends BaseCell {
  constructor(props) {
    super(props);

    this.onChangeOption = this.onChangeOption.bind(this);
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
   * @param {Event} e - event
   * @returns {void}
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
   * @returns {void}
   */
  getWrapperHeightOrMin() {
    if (this.wrapperNode) {
      return Math.max(this.wrapperNode.offsetHeight, this.wrapperNode.scrollHeight, this.wrapperNode.clientHeight, this.props.minHeight);
    } else {
      return this.props.minHeight;
    }
  }

  /**
   * The edit mode of the cell should render a view that allows to
   * modify the cell itself and would trigger the update of the data model.
   *
   * In this example we are showing a code editor.
   *
   * @returns {React.Component} a react view
   * @memberof NewCell
   */
  renderEditMode() {
    const minHeight = this.getWrapperHeightOrMin();

    // assumes that the data for this cell type is stored
    // within the source attribute as defined by nbformat
    let source = this.getSourceFromCell();

    if (source == null) {
      source = '';
    }

    // Get default language from notebook if mode is not available
    // This could be anymode and must not necessarly being edited as an editor
    const mode = this.props.cell.getIn(['metadata', 'mode'], 'plain');

    if (this.model) {
      this.model.setValue(source);
      setMode(this.model, mode);
    } else {
      this.model = createModel('temp', source, mode);
    }

    return (
      <div className="col-12" onKeyDown={this.onKeyDown}>
        <p className="text-muted">
          This is an example on how to extend the notebook with a new cell type.
        </p>
        <strong>New Cell Type</strong>
        <Editor
          fontSize="1.3rem"
          minHeight={minHeight}
          options={this.state.options}
          file={{model: this.model}}
          ref={editor => {
            this.editor = editor;
          }}
        />
      </div>
    );
  }

  /**
   * Render how the cell is shown to readers - the view mode.
   *
   * @returns {React.Component} viewmode rendered
   * @memberof NewCell
   */
  renderViewMode() {
    // Here it is also possible to retrieve additional metadata that is required for rendering
    //const format = this.props.cell.getIn(['metadata', 'format']);

    // source contains the source attribute according to nbformat
    const source = this.getSourceFromCell();

    return <div className="col-12" ref={this.onRef}><pre>{source}</pre></div>;
  }

  render() {
    const { cell, isEditModeActive, editing, dispatch } = this.props;
    let content;
    const metadata = <CellMetadata beforeChange={this.onUpdateCell} className="col-12" dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />; // renders the metadata editor
    const editingClass = editing ? ' editing' : ''; // adds a css class when the cell is currently edited
    const isVisible = this.isVisible(); // cells can be hidden (like in moodle)

    // Decide wether to render the view or edit mode
    if (!(isEditModeActive && editing)) {
      content = this.renderViewMode();
    } else {
      content = this.renderEditMode();
    }

    // combine all relevante css classes for the container div element
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

NewCell.propTypes = {
  minHeight: PropTypes.number,
  cell: PropTypes.object.isRequired,
  isEditModeActive: PropTypes.bool.isRequired,
  editing: PropTypes.bool.isRequired,
  cellIndex: PropTypes.number.isRequired
};

NewCell.defaultProps = {
  minHeight: 200
};