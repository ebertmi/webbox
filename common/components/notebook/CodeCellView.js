import React from 'react';
import { EditSession, UndoManager } from 'ace';
import classnames from 'classnames';

import BaseCell from './BaseCell';
import Editor from '../Editor';
import Icon from '../Icon';
import CellMetadata from './CellMetadata';
import { EditButtonGroup } from './EditButtonGroup';
import Terminal from '../ide/Terminal';

import { updateCell } from '../../actions/NotebookActions';

import { EmbedTypes, RunModeDefaults } from '../../constants/Embed';
import Markdown from '../../util/markdown';
import { createEmbedObject } from '../../util/embedUtils';
import { MessageListModel } from '../../models/messages';
import { usageConsole } from '../../util/usageLogger';

import SourceboxProject from '../../models/project/sourceboxProject';
import SkulptProject from '../../models/project/skulptProject';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class CodeCellView extends React.PureComponent {
  constructor(props) {
    super(props);

    this.switchEditMode = this.switchEditMode.bind(this);
    this.executeCode = this.executeCode.bind(this);
    this.switchReadMode = this.switchReadMode.bind(this);
    this.closeTerminal = this.closeTerminal.bind(this);
    this.onRun = this.onRun.bind(this);

    this.state = { rendered: '', editMode: false, showTerminal: false };

    // Maybe its good enough to set props into the state at this point, since the Values will not change for the View
  }

  componentDidMount() {
    this.renderMarkdown(this.props.code);
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
    const code = this.session != null ? this.session.getValue() : this.props.code;
    let notebookLanguageInformation = this.props.cell.getIn(['metadata', 'executionLanguage'], this.props.executionLanguage.executionLanguage);
    let notebookEmbedType = this.props.embedType || EmbedTypes.Sourcebox;
    const embedType = this.props.cell.getIn(['metadata', 'embedType'], notebookEmbedType);

    // Experimental
    const id = this.props.cell.getIn(['metadata', 'runid'], RunModeDefaults.id);

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
          rendered: rendered
        });
      });
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

  switchEditMode() {
    this.setState( { editMode: true } );
  }
  renderEditMode() {
    let minHeight = this.props.minHeight;
    let source = this.session != null ? this.session.getValue() : this.props.code;
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
      editMode: false
    });
    let content = this.session != null ? this.session.getValue() : this.props.code;
    this.renderMarkdown(content);
  }
  renderReadMode() {
    return <div className="col-xs-12" ref={this.onRef} dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
  }

  executeCode() {
    // Step 1: Get all relevant information, language, embed type and code
    let language = this.props.cell.getIn(['metadata', 'executionLanguage'], this.props.executionLanguage.executionLanguage);
    let notebookEmbedType = this.props.embedType || EmbedTypes.Sourcebox;
    const embedType = this.props.cell.getIn(['metadata', 'embedType'], notebookEmbedType);

    // I guess this should be either the original source or the changed source
    let code = this.session != null ? this.session.getValue() : this.props.code;
    //this.props.dispatch(updateCell(this.props.cell.get('id'), code));  //TODO:  So changes, in Edit Mode will not be reset by execute

    // Experimental
    const id = this.props.cell.getIn(['metadata', 'runid'], RunModeDefaults.id);

    // Create embed data object
    let embedData = createEmbedObject(code, language, embedType, id);

    let messageList = new MessageListModel(usageConsole);
    let projectData = {
      embed: embedData,
      user: window.__USER_DATA__,
      messageList: messageList,
      communication: {
        jwt: window.__WEBSOCKET__.authToken,
        url: window.__WEBSOCKET__.server
      }
    };

    let project;
    if (window.__INITIAL_STATE__.embedType === EmbedTypes.Sourcebox) {
      project = new SourceboxProject(projectData, {
        auth: window.__SOURCEBOX__.authToken,
        server: window.__SOURCEBOX__.server,
        transports: window.__SOURCEBOX__.transports || ['websocket']
      });
    } else if (window.__INITIAL_STATE__.embedType === EmbedTypes.Skulpt) {
      project = new SkulptProject(projectData);
    } else {
      console.error('Unsupported embedType', window.__INITIAL_STATE__.embedType);
    }

    if(this.state.showTerminal) {  // There should be a easier Way than this?
      this.setState({
        showTerminal: false,
        project: null
      }, () => this.setState({
        showTerminal: true,
        project: project
      }));
    }
    else {
      this.setState({
        showTerminal: true,
        project: project
      });
    }


    // execute the code
    project.run();
  }

  closeTerminal() {
    this.setState({
      showTerminal: false
    });
  }

  render() {
    const { cell, id, code } = this.props;
    const { editMode, showTerminal, project } = this.state;
    const classes = classnames("code-cell col-xs-12 row");
    const externalIcon = <Icon name="external-link" className="icon-control code-cell-run-btn hidden-print" onClick={this.onRun} title="IDE in neuem Fenster öffnen" />;
    const editIcon = <Icon name="edit" className="icon-control code-cell-run-btn hidden-print" onClick={this.switchEditMode} title="Zum Editiermodus wechseln" />;
    const readIcon = <Icon name="book" className="icon-control code-cell-run-btn hidden-print" onClick={this.switchReadMode} title="Zum Lesemodus wechseln" />;
    const playIcon = <Icon name="play" className="icon-control code-cell-run-btn hidden-print" onClick={this.executeCode} title="Ausführmodus" />;
    const closeTerminalIcon = <Icon name="close" className="icon-control code-cell-run-btn hidden-print" onClick={this.closeTerminal} title="Terminal schliessen" />;

    return (
      <div className={classes} id={id}>
        <div>
          { externalIcon }
          { editMode ? readIcon : editIcon}
          { playIcon }
          { showTerminal ? closeTerminalIcon : null }
        </div>
        { editMode ? this.renderEditMode() : this.renderReadMode() }
        <div className="ide-area" style={{height: '200px'}}>{ showTerminal ? <Terminal process={project.runner}/> : null }</div>
      </div>
    );
  }
}

