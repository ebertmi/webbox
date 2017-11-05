import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Editor from '../Editor';
import optionManager from '../../models/options';
import Icon from '../Icon';
import Terminal from '../ide/Terminal';
import MatplotlibPanel from '../ide/panels/MatplotlibPanel';
import TurtlePanel from '../ide/panels/TurtlePanel';
import CodeBlock from './CodeBlock';

import { EmbedTypes, RunModeDefaults } from '../../constants/Embed';

import { createEmbedObject } from '../../util/embedUtils';
import { createModel } from '../../util/monacoUtils';

import SourceboxProject from '../../models/project/sourceboxProject';
import SkulptProject from '../../models/project/skulptProject';
import {Severity} from '../../models/severity';

import Debug from 'debug';
const debug = Debug('webbox:CodeCellView');

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class CodeCellView extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onStartStopExecution = this.onStartStopExecution.bind(this);
    this.onSwitchMode = this.onSwitchMode.bind(this);
    this.onCloseTerminal = this.onCloseTerminal.bind(this);
    this.onUndoChanges = this.onUndoChanges.bind(this);
    this.onOpenInExternalWindow = this.onOpenInExternalWindow.bind(this);
    this.onProjectStateChange = this.onProjectStateChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onChangeOption = this.onChangeOption.bind(this);

    this.state = {
      editMode: false,
      showTerminal: false,
      options: optionManager.getOptions()
    };
  }

  componentDidMount() {
    optionManager.on('change', this.onChangeOption);
  }

  componentWillUnmount() {
    // Dispose listeners to avoid leaks
    if (this.state.project != null) {
      this.state.project.tabManager.removeListener('change', this.onProjectStateChange);
      this.state.project.on('change', this.onProjectStateChange);
    }

    optionManager.removeListener('change', this.onChangeOption);
  }

  onChangeOption() {
    this.setState({
      options: optionManager.getOptions()
    });
  }

  onKeyDown(e) {
    // Shift + Enter -> Execute Code
    if ((e.metaKey || (e.shiftKey && !e.altKey && !e.ctrlKey)) && e.key === 'Enter') {
      this.startStopExecution();
      e.preventDefault();
    }

    // Escape -> ReadMode
    if (!e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey && e.key === 'Escape' && this.state.editMode) {
      this.switchMode();
      e.preventDefault();
    }

  }

  onOpenInExternalWindow() {
    /**
     * Running an unnamed example:
     *  - Get the current code
     *  - Get the set language (we need to know how to run the code)
     *  - Either use the set id for statistics or generate a new one
     *  - Current course/chapter (for statistics)
     */
    const code = this.model != null ? this.model.getValue() : this.props.code;
    const notebookLanguageInformation = this.props.cell.getIn(['metadata', 'executionLanguage'], this.props.executionLanguage.executionLanguage);
    const notebookEmbedType = this.props.embedType || EmbedTypes.Sourcebox;
    const embedType = this.props.cell.getIn(['metadata', 'embedType'], notebookEmbedType);

    // Experimental
    const id = this.props.cell.getIn(['metadata', 'runid'], RunModeDefaults.id);

    const url = `${window.location.protocol}//${window.location.host}/run?language=${encodeURIComponent(notebookLanguageInformation)}&id=${encodeURIComponent(id)}&embedType=${encodeURIComponent(embedType)}&code=${encodeURIComponent(code)}`;
    const strWindowFeatures = 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes';

    window.open(url, 'Beispiel Ausführen', strWindowFeatures);
  }

  onCloseTerminal() {
    this.setState({
      showTerminal: false
    });
  }

  onUndoChanges() {
    this.model.setValue(this.props.code);
    this.setState({
      change: true
    });
  }

  onSwitchMode() {
    if (this.state.editMode) {
      this.setState({ editMode: false });
    } else {
      this.setState( { editMode: true } );
    }
  }

  onStartStopExecution() {
    // Lazy creation of the project and binding of listeners
    if (this.state.project == null) {
      this.initialize().then(success => {
        debug('after init in onStartStopExecution', success);
        // Only retry the start of the execution if the project has been successfully created
        if (success) {
          this.onStartStopExecution();
        }
      });

      return;
    }

    const code = this.model != null ? this.model.getValue() : this.props.code;
    const project = this.state.project;

    this.state.project.tabManager.closeTabByType('matplotlib');

    if (project.isRunning()) {
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

  onProjectStateChange() {
    this.setState({
      tabs: this.state.project.tabManager.getTabs()
    }, this.forceUpdate());  // To force a Rerender
  }

  /**
   * Helper to determine the height of the rendered markdown to set the ace editor size accordingly
   * @returns {Number} ace editor wrappers height or minimum
   */
  getWrapperHeightOrMin() {
    if (this.wrapperNode) {
      return Math.max(this.wrapperNode.offsetHeight, this.wrapperNode.scrollHeight, this.wrapperNode.clientHeight, this.props.minHeight);
    } else {
      return this.props.minHeight;
    }
  }


  initialize() {
    return this.createEmptyProject().then(project => {
      project.tabManager.on('change', this.onProjectStateChange);
      project.on('change', this.onProjectStateChange);
      this.setState({
        project: project,
        tabs: project.tabManager.getTabs()
      });

      return true;
    }).catch(err => {
      this.context.messageList.showMessage(Severity.Warning, err);
      debug('Failed to create empty project', err);
      return false;
    });
  }

  createEmptyProject() {
    // Step 1: Get all relevant information, language, embed type and code
    const language = this.props.cell.getIn(['metadata', 'executionLanguage'], this.props.executionLanguage.executionLanguage);
    const notebookEmbedType = this.props.embedType || EmbedTypes.Sourcebox;
    const id = this.props.cell.getIn(['metadata', 'runid'], RunModeDefaults.id);
    const embedType = this.props.cell.getIn(['metadata', 'embedType'], notebookEmbedType);

    const projectData = {
      embed: createEmbedObject('', language, embedType, id),
      user: window.__USER_DATA__,
      messageList: this.context.messageList,
      remoteDispatcher: this.context.remoteDispatcher,
    };

    // Defer project creation to the point where all resources are available
    const promise = new Promise((resolve, reject) => {
      if (embedType === EmbedTypes.Sourcebox) {
        // Check if user is authenticated and/or show error
        if (window.__SOURCEBOX__.authToken == null || window.__SOURCEBOX__.authToken === '') {
          reject(new Error('Sie müssen zum Verwenden dieser Funktion angemeldet sein.'));
        } else {
          resolve(new SourceboxProject(projectData, {
            auth: window.__SOURCEBOX__.authToken,
            server: window.__SOURCEBOX__.server,
            transports: window.__SOURCEBOX__.transports || ['websocket']
          }));
        }
      } else if (embedType === EmbedTypes.Skulpt) {
        // Check if skulpt is available, otherwise load the libs
        if (typeof Sk === 'undefined') {
          require.ensure([], require => {
            require('exports-loader?Sk!../../../public/skulpt/skulpt.min.js');
            require('exports-loader?Sk!../../../public/skulpt/skulpt-stdlib.js');
            resolve(new SkulptProject(projectData));
          });
        } else {
          resolve(new SkulptProject(projectData));
        }
      } else {
        reject(new Error("Ungültiger oder nicht unterstützter 'embedType' wurde eingestellt. Wenden Sie sich zur Lösung an den Autor!"));
      }
    });

    return promise;
  }

  handleAdditionalPanels(tabs) {
    let additionalPanel = false;
    return tabs.map(({active, item, type}, index) => {
      let PanelType;
      switch (type) {
        case 'turtle':
          PanelType = TurtlePanel;
          break;
        case 'matplotlib':
          PanelType = MatplotlibPanel;
          break;
        default:
      }

      if (PanelType && !additionalPanel) {
        additionalPanel = true;
        return <PanelType className="second-panel" key={index} active={active} item={item}/>;
      } else if (PanelType && additionalPanel) {
        this.context.messageList.showMessage(Severity.Warning, new Error('Anzeige mehrere Turtle- bzw. Matplotlib-Graphen wird nicht unterstützt!'));
      }

      return null;
    });
  }

  renderEditMode() {
    const minHeight = 100;
    const source = this.model != null ? this.model.getValue() : this.props.code;
    const languageName = this.props.notebookLanguage || 'python';
    const mode = this.props.cell.getIn(['metadata', 'mode'], languageName);

    // Reuse existing session if possible
    if (this.model) {
      this.model.setValue(source);
      // ToDo: mode selection
      //this.model.setMode(`ace/mode/${mode}`);
    } else {
      this.model = createModel('temp', source, mode);

      // Register change listener on the editor to know when to update
      this.model.onDidChangeContent(() => {
        this.setState({
          change: true
        });
      });
    }

    return (
      <div className="edit-view col-12" onKeyDown={this.onKeyDown}>
        <Editor
          options={this.state.options}
          minHeight={minHeight}
          maxLines={100}
          file={{model: this.model}}
          ref={editor => { this.editor = editor; }} />
      </div>
    );
  }

  renderReadMode() {
    const code = this.model != null ? this.model.getValue() : this.props.code;
    const executionLanguage = this.props.cell.getIn(['metadata', 'executionLanguage'], this.props.executionLanguage.executionLanguage);
    const mode = this.props.cell.getIn(['metadata', 'mode'], (this.props.notebookLanguage || 'python'));

    // Render the read mode depending on the given viewComponent
    return <this.props.viewComponent code={code} executionLanguage={executionLanguage} mode={mode}/>;
  }

  render() {
    const { code, className} = this.props;
    const { editMode, showTerminal, project, tabs } = this.state;
    const classes = classnames(`code-cell col-12 row ${className}`);
    const externalIcon = <Icon name="external-link" className="icon-control d-print-none" onClick={this.onOpenInExternalWindow} title="IDE in neuem Fenster öffnen" />;
    const editIcon = <Icon name="edit" className="icon-control d-print-none" onClick={this.onSwitchMode} title="Zum Editiermodus wechseln" />;
    const readIcon = <Icon name="book" className="icon-control d-print-none" onClick={this.onSwitchMode} title="Zum Lesemodus wechseln (Escape)" />;
    const playIcon = <Icon name="play" className="success icon-control d-print-none" onClick={this.onStartStopExecution} title="Code ausführen (Shift + Enter)" />;
    const stopIcon = <Icon name="stop" className="danger icon-control d-print-none" onClick={this.onStartStopExecution} title="Code stoppen" />;
    const undoIcon = <Icon name="undo" className="danger icon-control d-print-none" onClick={this.onUndoChanges} title="Änderungen rückgängig machen" />;
    const closeTerminalIcon = <Icon name="close" className="close-btn icon-control d-print-none" onClick={this.onCloseTerminal} title="Terminal schliessen" />;
    const additionalPanels = showTerminal ? this.handleAdditionalPanels(tabs, project, code) : null;
    //const missingEmbed = <div className="col-lg-12 col-md-12 col-12 alert alert-danger">Ungültiger embedType. Wenden Sie sich an den Autor!</div>;

    const ideArea = <div className="ide-area" style={{height: '200px'}}>
      { showTerminal ? closeTerminalIcon : null }
      { (project && project.runner) ? <Terminal process={project.runner}/> : null}
      { additionalPanels }
    </div>;

    return (
      <div className={classes}>
        { /*!project ? missingEmbed : null*/}
        <div className="action-btn-group">
          { externalIcon }
          { editMode ? readIcon : editIcon}
          { project ? (project.isRunning() ? stopIcon : playIcon) : playIcon}
          { this.model ? (this.model._alternativeVersionId <= 1 ? null : undoIcon) : null }
        </div>
        { editMode ? this.renderEditMode() : this.renderReadMode() }
        { showTerminal ? ideArea : null }
      </div>
    );
  }
}

CodeCellView.propTypes = {
  viewComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.element
  ]), /* use this instead of markdown-it */
  code: PropTypes.string.isRequired,
  cell: PropTypes.object.isRequired,
  executionLanguage: PropTypes.object.isRequired,
  notebookLanguage: PropTypes.string.isRequired,
  embedType: PropTypes.string.isRequired,
  className: PropTypes.string,
  minHeight: PropTypes.number
};

CodeCellView.defaultProps = {
  viewComponent: CodeBlock,
  className: '',
  minHeight: 100
};

CodeCellView.contextTypes = {
  messageList: PropTypes.object,
  remoteDispatcher: PropTypes.object
};