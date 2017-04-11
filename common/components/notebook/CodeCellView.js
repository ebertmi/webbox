import React from 'react';
import { EditSession, UndoManager } from 'ace';
import classnames from 'classnames';

import Editor from '../Editor';
import Icon from '../Icon';
import Terminal from '../ide/Terminal';
import MatplotlibPanel from '../ide/panels/MatplotlibPanel';
import TurtlePanel from '../ide/panels/TurtlePanel';
import CodeBlock from './CodeBlock';

import { EmbedTypes, RunModeDefaults } from '../../constants/Embed';

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

    this.state = { editMode: false, showTerminal: false };
  }

  componentWillMount() {
    let project = this.createEmptyProject();
    if (project) {
      project.tabManager.on('change', this.projectStateChange);
      project.on('change', this.projectStateChange);
      this.setState({project: project, tabs: project.tabManager.getTabs()});
    }
  }

  componentWillUnmount() {
    // Dispose listeners to avoid leaks
    if (this.state.project != null) {
      this.state.project.tabManager.removeListener('change', this.projectStateChange);
      this.state.project.on('change', this.projectStateChange);
    }
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
      remoteDispatcher: this.context.remoteDispatcher,
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
      this.context.messageList.showMessage(Severity.Error, new Error("Ungültiger oder nicht unterstützter 'embedType' wurde eingestellt. Wenden Sie sich zur Lösung an den Autor!"));
      return null;
    }
  }

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
    } else {
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
    let code = this.session != null ? this.session.getValue() : this.props.code;
    let executionLanguage = this.props.cell.getIn(['metadata', 'executionLanguage'], this.props.executionLanguage.executionLanguage);
    let mode = this.props.cell.getIn(['metadata', 'mode'], (this.props.notebookLanguage || 'python'));
    return <this.props.viewComponent code={code} executionLanguage={executionLanguage} mode={mode}/>;
  }

  startStopExecution() {
    let code = this.session != null ? this.session.getValue() : this.props.code;
    let project = this.state.project;

    this.state.project.tabManager.closeTabByType("matplotlib");

    if(project.isRunning()) {
      project.stop();
    } else {
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

  handleAdditionalPanels(tabs) {
    let additionalPanel = false;
    return tabs.map(({active, item, type}, index) => {
      let PanelType;
      switch(type) {
        case "turtle":
          PanelType = TurtlePanel;
          break;
        case "matplotlib":
          PanelType = MatplotlibPanel;
          break;
        default:
      }

      if(PanelType && !additionalPanel) {
        additionalPanel = true;
        return <PanelType className="second-panel" key={index} active={active} item={item}/>;
      } else if(PanelType && additionalPanel) {
        this.context.messageList.showMessage(Severity.Warning, new Error("Anzeige mehrere Turtle- bzw. Matplotlib-Graphen wird nicht unterstützt!"));
      }
    });
  }

  render() {
    const { id, code } = this.props;
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
    const missingEmbed = <div className="col-lg-12 col-md-12 col-xs-12 alert alert-danger">Ungültiger embedType. Wenden Sie sich an den Autor!</div>;

    const ideArea = <div className="ide-area" style={{height: '200px'}}>
      { showTerminal ? closeTerminalIcon : null }
      { project ? <Terminal process={project.runner}/> : null}
      { additionalPanels }
    </div>;

    return (
        <div className={classes} id={id}>
          { !project ? missingEmbed : null}
          <div className="action-btn-group">
            { externalIcon }
            { editMode ? readIcon : editIcon}
            { project ? (project.isRunning() ? stopIcon : playIcon) : null}
            { this.session ? (this.session.getValue() === code ? null : undoIcon) : null }
          </div>
          { editMode ? this.renderEditMode() : this.renderReadMode() }
          { showTerminal ? ideArea : null }
        </div>
    );
  }
}

CodeCellView.propTypes = {
  viewComponent: React.PropTypes.oneOfType([
    React.PropTypes.func,
    React.PropTypes.element
  ]), /* use this instead of markdown-it */
  code: React.PropTypes.string.isRequired,
  cell: React.PropTypes.object.isRequired,
  executionLanguage: React.PropTypes.object.isRequired,
  notebookLanguage: React.PropTypes.string.isRequired,
  embedType: React.PropTypes.string.isRequired
};

CodeCellView.defaultProps = {
  viewComponent: CodeBlock
};

CodeCellView.contextTypes = {
  messageList: React.PropTypes.object,
  remoteDispatcher: React.PropTypes.object
};