import React from 'react';
import { EditSession, UndoManager } from 'ace';
import classnames from 'classnames';

import BaseCell from './BaseCell';
import Editor from '../Editor';
import Icon from '../Icon';
import CellMetadata from './CellMetadata';
import { EditButtonGroup } from './EditButtonGroup';


import { updateCell } from '../../actions/NotebookActions';

import { EmbedTypes, RunModeDefaults } from '../../constants/Embed';
import Markdown from '../../util/markdown';
import  { notebookMetadataToSourceboxLanguage } from '../../util/nbUtil';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class CodeCell extends BaseCell {
  constructor(props) {
    super(props);

    this.onRef = this.onRef.bind(this);
    this.onRef = this.onRef.bind(this);
    this.switchEditMode = this.switchEditMode.bind(this);
    this.switchExecMode = this.switchExecMode.bind(this);
    this.switchReadMode = this.switchReadMode.bind(this);
    this.saveCurrentSessionToState = this.saveCurrentSessionToState.bind(this);

    this.state = { rendered: '', mode: 'read' };
  }

  componentDidMount() {
    this.renderMarkdown(this.getSourceFromCell());
  }

  saveCurrentSessionToState() {
    if (this.session) {
      let content = this.session.getValue();
      this.props.dispatch(updateCell(this.props.cell.get('id'), content));
    }
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

    const code = this.getSourceFromCell();
    let notebookLanguageInformation = this.props.cell.getIn(['metadata', 'executionLanguage'], this.props.executionLanguage.executionLanguage);
    let notebookEmbedType = this.props.embedType || EmbedTypes.Sourcebox;
    const embedType = this.props.cell.getIn(['metadata', 'embedType'], notebookEmbedType);

    // Experimental
    const id = this.props.cell.getIn(['metadata', 'runid'], RunModeDefaults.id);
    console.log("id: " + id);

    const url = `${window.location.protocol}//${window.location.host}/run?language=${encodeURIComponent(notebookLanguageInformation)}&id=${encodeURIComponent(id)}&embedType=${encodeURIComponent(embedType)}&code=${encodeURIComponent(code)}`;
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
        rendered: rendered,
        mode: this.state.mode
      });
    });
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
    let source = this.getSourceFromCell();

    // Get default language from notebook if mode is not available
    let languageName = this.props.notebookLanguage || 'python';
    let mode = this.props.cell.getIn(['metadata', 'mode'], languageName);

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
        <p className="text-muted">Sie können über die Schlüssel <code>embedType</code> (<em>sourcebox</em> oder <em>skulpt</em>) und <code>executionLanguage</code> die Ausführungsumgebung für eine Zelle einzeln definieren. Ansonsten werden die Werte aus den Notebook-Metadaten übernommen. Sie können die Syntax-Hervorhebung (Farben) über den Schlüssel <code>mode</code> ändern.</p>
        <Editor fontSize="14px" minHeight={minHeight} maxLines={100} session={this.session} ref={editor => this.editor = editor} />
      </div>
    );
  }

  // DEPRECATED, use renderReadMode()
  renderViewMode() {
    return <div className="col-xs-12" ref={this.onRef} dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
  }

  // ##################################################################################################################
  // ##################################################################################################################
  // ##################################################################################################################
  // ##################################################################################################################

  switchEditMode() {
    this.setState({
      rendered: this.state.rendered,
      mode: "edit"
    });
  }
  renderEditMode2() {
    let minHeight = this.getWrapperHeightOrMin();
    let source = this.getSourceFromCell();
    let languageName = this.props.notebookLanguage || 'python';
    let mode = this.props.cell.getIn(['metadata', 'mode'], languageName);

    if (this.session) {
      this.session.setValue(source);
      this.session.setMode('ace/mode/' + mode);
    } else {
      this.session = new EditSession(source, 'ace/mode/' + mode);
      this.session.setUndoManager(new UndoManager);
    }

    return (
      <div className="col-xs-12" onKeyDown={this.onKeyDown}>
        <strong>Editiermodus (Changes are only temporary)</strong>
        <Editor fontSize="14px" minHeight={minHeight} maxLines={100} session={this.session} ref={editor => this.editor = editor} />
      </div>
    );
  }

  switchReadMode() {
    this.setState({
      rendered: this.state.rendered,
      mode: "read"
    });
    let content = this.session.getValue();
    this.props.dispatch(updateCell(this.props.cell.get('id'), content));
    this.renderMarkdown(content);
  }
  renderReadMode() {
    return <div className="col-xs-12" ref={this.onRef} dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
  }

  switchExecMode() {
    this.setState({
      rendered: this.state.rendered,
      mode: "exec"
    });
  }


  // ##################################################################################################################
  // ##################################################################################################################
  // ##################################################################################################################
  // ##################################################################################################################

  render() {
    const { cell, isEditModeActive, editing, dispatch } = this.props;
    let content;
    let metadata = <CellMetadata beforeChange={this.saveCurrentSessionToState} className="col-xs-12" dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />;
    let editingClass = editing ? ' editing' : '';
    const isVisible = this.isVisible();

    if (!(isEditModeActive && editing)) {
      if(this.state.mode == "edit") {
        content = this.renderEditMode2();
      }
      else if(this.state.mode == "read") {
        content = this.renderReadMode();
      }
      else if(this.state.mode == "exec") {

      }
      else {
        // IllegalState -> render default read view
        content = this.renderReadMode();
      }
    } else {
      content = this.renderEditMode();
    }

    const classes = classnames("code-cell col-xs-12 row", editingClass, {
      'cell-not-visible': !isVisible
    });

    // TODO: Icons should be hidden, while in DocumentEditMode
    return (
      <div className={classes} id={this.props.id}>
        <EditButtonGroup isVisible={isVisible} isEditModeActive={isEditModeActive} editing={editing} onToggleVisibility={this.onToggleVisibility} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        <Icon name="external-link" className="icon-control code-cell-run-btn hidden-print" onClick={this.onRun} title="IDE in neuem Fenster öffnen" />
        <Icon name="edit" className="icon-control code-cell-run-btn hidden-print" onClick={this.switchEditMode} title="Editiermodus" />
        <Icon name="book" className="icon-control code-cell-run-btn hidden-print" onClick={this.switchReadMode} title="Lesemodus" />
        <Icon name="code" className="icon-control code-cell-run-btn hidden-print" onClick={this.switchExecMode} title="Ausführmodus" />
        {content}
      </div>
    );
  }
}

CodeCell.propTypes = {
  minHeight: React.PropTypes.number,
  cell: React.PropTypes.object.isRequired,
  isEditModeActive: React.PropTypes.bool.isRequired,
  editing: React.PropTypes.bool.isRequired,
  cellIndex: React.PropTypes.number.isRequired,
  id: React.PropTypes.string.isRequired
};

CodeCell.defaultProps = {
  minHeight: 200
};
