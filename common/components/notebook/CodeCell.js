import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import BaseCell from './BaseCell';
import Editor from '../Editor';
import CellMetadata from './CellMetadata';
import { EditButtonGroup } from './EditButtonGroup';
import CodeCellView from './CodeCellView';
import { updateCell } from '../../actions/NotebookActions';
import Markdown from '../../util/markdown';
import { createModel, setMode } from '../../util/monacoUtils';
import optionManager from '../../models/options';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class CodeCell extends BaseCell {
  constructor(props) {
    super(props);

    this.onRef = this.onRef.bind(this);
    this.saveCurrentSessionToState = this.saveCurrentSessionToState.bind(this);

    this.state = {
      rendered: '',
      options: optionManager.getOptions()
    };
  }

  componentDidMount() {
    this.renderMarkdown(this.getSourceFromCell());

    optionManager.on('change', this.onChangeOption); 
  }

  componentWillUnmount() {
    optionManager.removeListener('change', this.onChangeOption);
  }

  saveCurrentSessionToState() {
    if (this.model) {
      const content = this.model.getValue();
      this.props.dispatch(updateCell(this.props.cell.get('id'), content));
    }
  }

  /**
   * Renders marks down and sets the returned markup as state when finished.
   *
   * @param {string} source - markdown formatted string to render to html
   *
   * @returns {void}
   */
  renderMarkdown(source) {
    // Get default language from notebook if mode is not available
    const language = this.props.notebookLanguage || 'python';
    const mode = this.props.cell.getIn(['metadata', 'mode'], language);

    const codeSource = `\`\`\`${mode}\n${source}\n\`\`\``;
    Markdown.render(codeSource)
      .then((rendered) => {
        this.setState({
          rendered: rendered
        });
      });
  }

  onChangeOption() {
    this.setState({
      options: optionManager.getOptions()
    });
  }

  /**
   * Saves the "source" property of a cell.
   *
   * @returns {void}
   */
  onUpdateCell() {
    if (this.model) {
      const content = this.model.getValue();
      this.props.dispatch(updateCell(this.props.cell.get('id'), content));
      this.renderMarkdown(content);
    } else {
      console.warn('CodeCell.onSaveCellSource called with invalid session', this.model);
    }
  }

  onRef(node) {
    if (node) {
      this.wrapperNode = node;
    }
  }

  /**
   * Helper to determine the height of the rendered markdown to set the ace editor size accordingly
   *
   * @returns {number} height
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
    const source = this.getSourceFromCell();

    // Get default language from notebook if mode is not available
    const languageName = this.props.notebookLanguage || 'python';
    const mode = this.props.cell.getIn(['metadata', 'mode'], languageName);

    if (this.model) {
      this.model.setValue(source);
      setMode(this.model, mode);
    } else {
      this.model = createModel('temp', source, mode);
    }

    return (
      <div className="col-12" onKeyDown={this.onKeyDown}>
        <strong>Code</strong>
        <p className="text-muted">Sie können über die Schlüssel <code>embedType</code> (<em>sourcebox</em> oder <em>skulpt</em>) und <code>executionLanguage</code> die Ausführungsumgebung für eine Zelle einzeln definieren. Ansonsten werden die Werte aus den Notebook-Metadaten übernommen. Sie können die Syntax-Hervorhebung (Farben) über den Schlüssel <code>mode</code> ändern.</p>
        <Editor
          fontSize="14px"
          minHeight={minHeight}
          maxLines={100}
          file={{model: this.model}}
          ref={editor => this.editor = editor}
        />
      </div>
    );
  }

  render() {
    const { cell, isEditModeActive, editing, dispatch, id, executionLanguage, notebookLanguage, embedType } = this.props;
    let content;
    const metadata = <CellMetadata beforeChange={this.saveCurrentSessionToState} className="col-12" dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />;
    const editingClass = editing ? ' editing' : '';
    const isVisible = this.isVisible();

    if (isEditModeActive && editing) {
      content = this.renderEditMode();
    } else {
      content = <CodeCellView code={this.getSourceFromCell()} cell={cell} executionLanguage={executionLanguage}
        notebookLanguage={notebookLanguage} embedType={embedType}/>;
    }

    const classes = classnames('code-cell col-12 row', editingClass, {
      'cell-not-visible': !isVisible
    });

    return (
      <div className={classes} id={id}>
        <EditButtonGroup isVisible={isVisible} isEditModeActive={isEditModeActive} editing={editing} onToggleVisibility={this.onToggleVisibility} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        {content}
      </div>
    );
  }
}

CodeCell.propTypes = {
  minHeight: PropTypes.number,
  cell: PropTypes.object.isRequired,
  isEditModeActive: PropTypes.bool.isRequired,
  editing: PropTypes.bool.isRequired,
  cellIndex: PropTypes.number.isRequired,
  id: PropTypes.string.isRequired
};

CodeCell.defaultProps = {
  minHeight: 200
};
