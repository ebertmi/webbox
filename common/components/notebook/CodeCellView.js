import React from 'react';
import { EditSession, UndoManager } from 'ace';
import classnames from 'classnames';

import Editor from '../Editor';
import Icon from '../Icon';
import Terminal from '../ide/Terminal';
import MatplotlibPanel from '../ide/panels/MatplotlibPanel';
import TurtlePanel from '../ide/panels/TurtlePanel';


import { EmbedTypes, RunModeDefaults } from '../../constants/Embed';
import Markdown from '../../util/markdown';
import { createEmbedObject } from '../../util/embedUtils';

import SourceboxProject from '../../models/project/sourceboxProject';
import SkulptProject from '../../models/project/skulptProject';
import {Severity} from "../../models/severity";

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class CodeCellView extends React.PureComponent {
  constructor(props) {
    super(props);

    this.startStopExecution = this.startStopExecution.bind(this);
    this.switchMode = this.switchMode.bind(this);
    this.closeTerminal = this.closeTerminal.bind(this);
    this.undoChanges = this.undoChanges.bind(this);
    this.onRun = this.onRun.bind(this);
    this.projectStateChange = this.projectStateChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.state = { rendered: '', editMode: false, showTerminal: false };
  }

  componentWillMount() {
    let project = this.createEmptyProject();
    project.tabManager.on('change', this.projectStateChange);
    project.on('change',() => this.projectStateChange());
    this.setState({project: project, tabs: project.tabManager.getTabs()});
  }
  componentDidMount() {
    this.renderMarkdown(this.props.code);
  }

  onKeyDown(e) {
    // Shift + Enter -> Execute Code
    if((e.metaKey || (e.shiftKey && !e.altKey && !e.ctrlKey)) && e.key === "Enter") {
      this.startStopExecution();
      e.preventDefault();
    }

      console.log(e.key);
    // Escape -> ReadMode
    if(!e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey && e.key === "Escape" && this.state.editMode) {
      this.switchMode();
      e.preventDefault();
    }

  }

  createEmptyProject() {
    // Step 1: Get all relevant information, language, embed type and code
    let language = this.props.cell.getIn(['metadata', 'executionLanguage'], this.props.executionLanguage.executionLanguage);
    let notebookEmbedType = this.props.embedType || EmbedTypes.Sourcebox;
    const id = this.props.cell.getIn(['metadata', 'runid'], RunModeDefaults.id);
    const embedType = this.props.cell.getIn(['metadata', 'embedType'], notebookEmbedType);

    let projectData = {
      embed: createEmbedObject('', language, embedType, id),
      user: window.__USER_DATA__,
      messageList: this.context.messageList,
      communication: {
        jwt: window.__WEBSOCKET__.authToken,
        url: window.__WEBSOCKET__.server
      }
    };

    if (embedType === EmbedTypes.Sourcebox) {
      return new SourceboxProject(projectData, {
        auth: window.__SOURCEBOX__.authToken,
        server: window.__SOURCEBOX__.server,
        transports: window.__SOURCEBOX__.transports || ['websocket']
      });
    } else if (embedType === EmbedTypes.Skulpt) {
      return new SkulptProject(projectData);
    } else {
      this.context.messageList.showMessage(Severity.Error, new Error("Innerhalb dieser Komponente nur eine Turtle bzw. Matplotlib möglich."));
      console.error('Unsupported embedType', window.embedType);
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

  switchMode() {
    if(this.state.editMode) {
      this.setState({ editMode: false });
      let content = this.session != null ? this.session.getValue() : this.props.code;
      this.renderMarkdown(content);
    }
    else {
      this.setState( { editMode: true } );
    }
  }

  renderEditMode() {
    let minHeight = 100;
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
      <div className="edit-view col-xs-12" onKeyDown={this.onKeyDown}>
        <Editor fontSize="14px" minHeight={minHeight} maxLines={100} session={this.session} ref={editor => this.editor = editor} />
      </div>
    );
  }


  renderReadMode() {
    return <div className="col-xs-12 read-view" ref={this.onRef} dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
  }

  startStopExecution() {
    let code = this.session != null ? this.session.getValue() : this.props.code;
    let project = this.state.project;

    this.state.project.tabManager.closeTabByType("matplotlib");

    if(project.isRunning()) {
      project.stop();
    }
    else {
      project.getFiles()[0].setValue(code);
      this.setState({
        showTerminal: true,
        project: project,
        tabs: this.state.project.tabManager.getTabs()
      });
      project.run();      // execute the code
    }
  }

  projectStateChange() {
    this.setState({
      tabs: this.state.project.tabManager.getTabs()
    }, this.forceUpdate());  // To force a Rerender
  }



  closeTerminal() {
    this.setState({
      showTerminal: false
    });
  }

  undoChanges() {
    this.session.setValue(this.props.code);
    this.setState({
      change: true
    });
  }

  handleAdditionalPanels(tabs, project) {
    let additionalTabCount = 0;
    return tabs.map(({active, item, type}, index) => {
      if(type === "turtle" || type === "matplotlib") {
        if(additionalTabCount === 0) {
          additionalTabCount++;
          let PanelType = type == "turtle" ? TurtlePanel : MatplotlibPanel;
          return <PanelType className="second-panel" key={index} active={active} item={item}/>;
        }
        else {
          this.context.messageList.showMessage(Severity.Error, new Error("Innerhalb dieser Komponente nur eine Turtle bzw. Matplotlib möglich."));
          this.closeTerminal();
          project.stop();
        }
      }
    });
  }

  render() {
    const { cell, id, code } = this.props;
    const { editMode, showTerminal, project, tabs } = this.state;
    const classes = classnames("code-cell col-xs-12 row");
    const externalIcon = <Icon name="external-link" className="icon-control hidden-print" onClick={this.onRun} title="IDE in neuem Fenster öffnen" />;
    const editIcon = <Icon name="edit" className="icon-control hidden-print" onClick={this.switchMode} title="Zum Editiermodus wechseln" />;
    const readIcon = <Icon name="book" className="icon-control hidden-print" onClick={this.switchMode} title="Zum Lesemodus wechseln (Escape)" />;
    const playIcon = <Icon name="play" className="success icon-control hidden-print" onClick={this.startStopExecution} title="Code ausführen (Shift + Enter)" />;
    const stopIcon = <Icon name="stop" className="danger icon-control hidden-print" onClick={this.startStopExecution} title="Code stoppen" />;
    const undoIcon = <Icon name="undo" className="danger icon-control hidden-print" onClick={this.undoChanges} title="Änderungen rückgängig machen" />;
    const closeTerminalIcon = <Icon name="close" className="close-btn icon-control hidden-print" onClick={this.closeTerminal} title="Terminal schliessen" />;
    let additionalPanels = showTerminal ? this.handleAdditionalPanels(tabs, project, code) : null;

    const playStopBtn = <div className="code-cell-btn" onClick={this.startStopExecution}>
      { project.isRunning() ? stopIcon : playIcon }
      { project.isRunning() ? "Stoppen" : "Ausführen" }
    </div>;

    const ideArea = <div className="ide-area" style={{height: '400px'}}>
      { showTerminal ? closeTerminalIcon : null }
      <Terminal process={project.runner}/>
      { additionalPanels }
    </div>;

    //<div className="btn-area"> {playStopBtn} </div>
    return (
      <div className={classes} id={id}>
        <div className="action-btn-group">
          { externalIcon }
          { editMode ? readIcon : editIcon}
          { project.isRunning() ? stopIcon : playIcon}
          { this.session ? (this.session.getValue() === code ? null : undoIcon) : null }
        </div>
        { editMode ? this.renderEditMode() : this.renderReadMode() }

        { showTerminal ? ideArea : null }
      </div>
    );
  }
}


CodeCellView.contextTypes = {
  messageList: React.PropTypes.object
};