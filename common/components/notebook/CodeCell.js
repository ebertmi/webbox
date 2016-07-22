import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import { EditSession, UndoManager } from 'ace';

import Editor from '../Editor';
import Icon from '../Icon';
import CellMetadata from './CellMetadata';
import { EditButtonGroup } from './EditButtonGroup';


import { editCell, deleteCell, stopEditCell, updateCell, moveCellUp, moveCellDown } from '../../actions/NotebookActions';

import { EmbedTypes, RunModeDefaults } from '../../constants/Embed';
import Markdown from '../../util/markdown';
import { sourceFromCell } from '../../util/nbUtil';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class CodeCell extends React.Component {
  constructor(props) {
    super(props);

    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onStopEdit = this.onStopEdit.bind(this);
    this.onUpdateCell = this.onUpdateCell.bind(this);
    this.onRef = this.onRef.bind(this);
    this.onCellUp = this.onCellUp.bind(this);
    this.onCellDown = this.onCellDown.bind(this);
    this.onRun = this.onRun.bind(this);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  componentWillMount() {
    this.setState({
      rendered: ''
    });
  }

  componentDidMount() {
    this.renderMarkdown(sourceFromCell(this.props.cell));
  }

  /**
   * Clicked the run button. Should we enable postMessage communication with the new window?
   * Maybe at some point later
   */
  onRun() {
    /**
     * Running an unnamed example:
     *  - Get the current code
     *  - Get the set language (we need to know how to run the code)
     *  - Either use the set id for statistics or generate a new one
     *  - Current course/chapter (for statistics)
     */

    const code = sourceFromCell(this.props.cell);
    const language = 'python3';
    let notebookEmbedType = this.props.embedType || EmbedTypes.Sourcebox;
    const embedType = this.props.cell.getIn(['metadata', 'embedType'], notebookEmbedType);

    // Experimental
    const id = this.props.cell.getIn(['metadata', 'runid'], RunModeDefaults.id);

    const url = `${window.location.protocol}//${window.location.host}/run?language=${encodeURIComponent(language)}&id=${encodeURIComponent(id)}&embedType=${encodeURIComponent(embedType)}&code=${encodeURIComponent(code)}`;
    const strWindowFeatures = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";

    window.open(url, "Beispiel Ausführen", strWindowFeatures);
  }

  /**
   * Renders marks down and sets the returned markup as state when finished.
   */
  renderMarkdown(source) {
    // Get default language from notebook if mode is not available
    let language = this.props.notebookLanguage || 'python';
    let mode = this.props.cell.getIn(['metadata', 'mode'], language);

    const codeSource = '```' + mode + '\n' + source + '\n```';
    Markdown.render(codeSource)
    .then((rendered) => {
      this.setState({
        rendered: rendered
      });
    });
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
    if (e) {
      e.preventDefault();
    }

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
      this.renderMarkdown(content);
    } else {
      console.warn('CodeCell.onSaveCellSource called with invalid session', this.session);
    }
  }

  onRef(node) {
    if (node) {
      this.wrapperNode = node;
    }
  }

  /**
   * Check for Ctrl+S and try to save the document if possible
   */
  onKeyDown(e) {
    let key = e.which || e.keyCode;
    if (key === 27) {
      // Escape Key pressed
      this.onStopEdit();
    }
  }

  /**
   * Helper to determine the height of the rendered markdown to set the ace editor size accordingly
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

    // Get default language from notebook if mode is not available
    let language = this.props.notebookLanguage || 'python';
    let mode = this.props.cell.getIn(['metadata', 'mode'], language);

    if (this.session) {
      this.session.setValue(source);
      this.session.setMode('ace/mode/' + mode);
    } else {
      this.session = new EditSession(source, 'ace/mode/' + mode);
      this.session.setUndoManager(new UndoManager);
    }

    return (
      <div className="col-xs-12" onKeyDown={this.onKeyDown}>
        <strong>Code</strong>
        <p className="text-muted">Sie können über die Schlüssel <code>embedType</code> (<em>sourcebox</em> oder <em>skulpt</em>) und <code>mode</code> (Sprache) die Ausführungsumgebung für eine Zelle einzeln definieren. Ansonsten werden die Werte aus den Notebook-Metadaten übernommen.</p>
        <Editor fontSize="14px" minHeight={minHeight} maxLines={100} session={this.session} ref={editor => this.editor = editor} />
      </div>
    );
  }

  renderViewMode() {
    return <div className="col-xs-12" ref={this.onRef} dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
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
      <div className={"code-cell col-md-12 row " + editingClass}>
        <EditButtonGroup isAuthor={isAuthor} editing={editing} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        <Icon name="play-circle-o" className="icon-control" onClick={this.onRun} title="Code Ausführen" />
        {content}
      </div>
    );
  }
}

CodeCell.propTypes = {
  minHeight: React.PropTypes.number,
  cell: React.PropTypes.object.isRequired,
  isAuthor: React.PropTypes.bool.isRequired,
  editing: React.PropTypes.bool.isRequired,
  cellIndex: React.PropTypes.number.isRequired
};

CodeCell.defaultProps = {
  minHeight: 200
};
