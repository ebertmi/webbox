import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import MarkdownCell from './MarkdownCell';
import CodeEmbedCell from './CodeEmbedCell';
import RawCell from './RawCell';
import CodeCell from './CodeCell';
import AddControls from './AddControls';
import NotebookMetadata from './NotebookMetadata';

import { MessageListModel, MessageWithAction } from '../../models/messages';
import { Action } from '../../models/actions';
import { Severity } from '../../models/severity';
import { MessageList } from '../messagelist/messageList';
import {RemoteDispatcher} from '../../models/insights/remoteDispatcher';

import { loadCellsFromIPYNB, stateToJS, replaceIdWithSlug, notebookMetadataToSourceboxLanguage } from '../../util/nbUtil';
import { addCellsFromJS, toggleViewMode, updateNotebookMetadata } from '../../actions/NotebookActions';

import { API } from '../../services';


/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class Notebook extends React.Component {
  constructor(props) {
    super(props);

    // Create global message list
    this.messageList = new MessageListModel();

    // Create global websocket connection
    this.remoteDispatcher = new RemoteDispatcher();
    this.remoteDispatcher.on('reconnect_failed', this.onReconnectFailed.bind(this));

    this.onDrop = this.onDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onToggleViewMode = this.onToggleViewMode.bind(this);

    this.state = {
      isDragging: false,
      dashboardComponent: null
    };
  }

  // Make messageList available in the tree
  getChildContext() {
    return {
      messageList: this.messageList,
      remoteDispatcher: this.remoteDispatcher
    };
  }

  componentDidMount() {
    // handle Ctrl+S on the whole document even when nothing is focused
    document.addEventListener('keydown', this.onKeyDown);

    // Try to update url
    replaceIdWithSlug(this.props.notebook.get('id'), this.props.notebook.get('slug'));
  }

  /**
   * Callback which will be invoked if reconnect failed
   * @returns{void}
   */
  onReconnectFailed() {
    this.showMessage(Severity.Warning, 'Derzeit konnte keine Verbindung zum Server hergestellt werden. Sind sie offline?');
  }

  /**
   * Show a message as a box
   * @returns{void}
   */
  showMessage(severity, message) {
    if (this.messageList) {
      this.messageList.showMessage(severity, message);
    }
  }

  /**
   * Check for Ctrl+S and try to save the document if possible
   * @returns{void}
   */
  onKeyDown(e) {
    const key = e.which || e.keyCode;
    if ((e.metaKey || (e.ctrlKey && !e.altKey)) && key === 83) {
      // Pressed Ctrl-S for saving
      if (this.props.notebook.get('isAuthor', false)) {
        this.onSave();
      }
      e.preventDefault();
    } else if ((e.metaKey || (e.ctrlKey && !e.altKey)) && key === 77) {
      // Pressed Ctrl+M to open the presentation
      this.onPresentationMode();
    } else if ((e.metaKey || (e.ctrlKey && !e.altKey)) && key === 81) {
      // Pressed Ctrl-Q to toggle view mode
      if (this.props.notebook.get('isAuthor', false)) {
        this.onToggleViewMode();
      }
      e.preventDefault();
    }
  }

  onToggleViewMode() {
    this.props.dispatch(toggleViewMode());
  }

  onPresentationMode() {
    const linkToPresentation = `/p/${this.props.notebook.get('id')}`;

    window.open(linkToPresentation);
  }

  onSave() {
    const documentObj = stateToJS(this.props.notebook);
    API.document.save({ id: documentObj.id }, { document: documentObj }).then(res => {
      if (!res.error) {
        this.messageList.showMessage(Severity.Ignore, 'Erfolgreich gespeichert.');

        this.props.dispatch(updateNotebookMetadata('slug', res.document.slug));
        // Update current url with slug from the server and update the notebook slug here
        replaceIdWithSlug(this.props.notebook.get('id'), res.document.slug);
      } else {
        this.messageList.showMessage(Severity.Error, res.error);
      }
    }).catch(err => {
      if (err == null) {
        err = new Error('Die Funktion konnte nicht ausgeführt werden.');
      }
      this.messageList.showMessage(Severity.Error, err);
    });
  }

  onDelete() {
    const id = this.props.notebook.get('id');
    let messageObj;
    const deleteAction = new Action('delete.delete.action', 'Löschen', '', true, () => {
      API.document.delete({ id: id }).then(res => {
        if (!res.error) {
          // Redirect to main page
          window.location.replace(`${window.location.protocol}//${window.location.host}`);
        } else {
          this.messageList.showMessage(Severity.Error, res.error);
        }
      }).catch(err => {
        this.messageList.showMessage(Severity.Error, err);
      });

      // Hide message
      this.messageList.hideMessage(messageObj);
    });

    const cancelAction = new Action('cancel.delete.document', 'Abbrechen', '', true, () => {
      this.messageList.hideMessage(messageObj);
    });

    messageObj = new MessageWithAction('Wollen Sie das Dokument wirklich löschen? Sie können davor das Dokument auch exportieren.', [deleteAction, cancelAction]);

    this.messageList.showMessage(Severity.Warning, messageObj);
  }


  onDrop(e) {
    e.preventDefault();
    const target = e.target;

    // Stop image upload drops bubbling up, here
    if (target.getAttribute('data-name') === 'image-upload') {
      return;
    }

    // handle uploading
    const files = e.dataTransfer.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // notebook format
      if (file.name && file.name.endsWith('.ipynb')) {
        this.messageList.showMessage(Severity.Ignore, `Importiere ${file.name}... Dies kann einen Moment dauern.`);
        const reader = new FileReader();

        reader.onload = () => {
          const result = loadCellsFromIPYNB(reader.result);

          // Check if an error as occured during parsing the file!
          if (result instanceof Error) {
            this.messageList.showMessage(Severity.Error, result);
            return;
          }

          const {cells, language} = result;

          this.props.dispatch(addCellsFromJS(cells, language, false, () => {
            this.messageList.showMessage(Severity.Ignore, 'Daten wurden importiert.');
          }));

        };

        reader.readAsText(file);
      } else {
        // ToDo: handle images
        this.messageList.showMessage(Severity.Warning, 'Es werden derzeit nur ipynb-Dateien unterstützt.');
      }
    }

    this.setState({
      isDragging: false
    });
  }

  onDragEnter(e) {
    e.preventDefault();

    this.setState({
      isDragging: true
    });
  }

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.dropEffect = 'copy';
    this.setState({
      isDragging: true
    });
  }

  renderCells() {
    const activeBlock = this.props.notebook.get('activeBlock');
    const isEditModeActive = this.props.notebook.get('isEditModeActive');
    const cells = this.props.notebook.get('cells');
    const cellOrder = this.props.notebook.get('cellOrder');
    const notebookId = this.props.notebook.get('id');
    const course = this.props.notebook.get('course');
    const embedType = this.props.notebook.get('embedType');
    const notebookLanguage = this.props.notebook.getIn(['metadata', 'language_info', 'name'], 'plain');
    const executionLanguage = notebookMetadataToSourceboxLanguage(this.props.notebook.get('metadata'));

    const blocks = [];
    const dispatch = this.props.dispatch;

    // iterate over the list mapping of index->cellId
    cellOrder.map((cellId, index) => {
      const cell = cells.get(cellId);
      const id = cell.get('id');

      if (isEditModeActive) {
        blocks.push(
          <AddControls dispatch={dispatch} key={'add' + id} cellIndex={index} id={id} isEditModeActive={isEditModeActive} />
        );
      }

      // push actual cell
      switch (cell.get('cell_type')) {
        case 'markdown':
          blocks.push(<MarkdownCell document={notebookId} course={course} dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isEditModeActive={isEditModeActive} editing={index === activeBlock}/>);
          break;
        case 'code':
          blocks.push(<CodeCell embedType={embedType} course={course} executionLanguage={executionLanguage} notebookLanguage={notebookLanguage} dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isEditModeActive={isEditModeActive} editing={index === activeBlock}/>);
          break;
        case 'codeembed':
          blocks.push(<CodeEmbedCell course={course} dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isEditModeActive={isEditModeActive}editing={index === activeBlock}/>);
          break;
        case 'raw':
          blocks.push(<RawCell dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isEditModeActive={isEditModeActive} editing={index === activeBlock}/>);
          break;
        default:
        //return null;
      }

    });

    if (isEditModeActive) {
      blocks.push(
          <AddControls dispatch={dispatch} key="add-end" isEditModeActive={isEditModeActive} />
      );
    }

    return blocks;
  }

  renderNotebook() {
    const undoStackSize = this.props.notebook.get('undoStack').size;
    const redoStackSize = this.props.notebook.get('redoStack').size;
    const course = this.props.notebook.get('course');
    const embedType = this.props.notebook.get('embedType');
    const id = this.props.notebook.get('id');

    // Is the Notebook Metadata editable?
    const editable = this.props.notebook.get('notebookMetadataEditable');

    // Is Author, renders the edit buttons or the view mode
    const isEditModeActive = this.props.notebook.get('isEditModeActive');

    const classes = classnames("notebook row", {
      'view-mode': !isEditModeActive
    });

    let dashboard = null;

    if (this.state.dashboardComponent != null && this.props.notebook.get('showAnalytics')) {
      dashboard = <this.state.dashboardComponent notebook={this.props.notebook} />;
    }

    return (
      <div data-drag={true} className={classes} onDragOver={this.onDragOver} onDrop={this.onDrop}>
        <div className="global-message-list">
          <MessageList messageList={this.messageList} />
        </div>
        <NotebookMetadata
          isAuthor={this.props.notebook.get('isAuthor')}
          authors={this.props.notebook.get('authors')}
          isEditModeActive={isEditModeActive}
          onSave={this.onSave}
          onDelete={this.onDelete}
          redoStackSize={redoStackSize}
          undoStackSize={undoStackSize}
          editable={editable}
          slug={this.props.notebook.get('slug')}
          course={course}
          embedType={embedType}
          id={id} />
        { dashboard }
        { this.renderCells() }
      </div>
    );
  }

  render() {
    // Init dynamic loading of AnalyticsDashboard to reduce initial load
    if (this.props.notebook.get('showAnalytics') && this.state.dashboardComponent == null) {
      require.ensure('./analytics/AnalyticsDashboard', require => {
        const AnalyticsDashboard = require('./analytics/AnalyticsDashboard');
        this.setState({dashboardComponent: AnalyticsDashboard.default});
      });
    }

    return this.renderNotebook();
  }
}

Notebook.childContextTypes = {
  messageList: PropTypes.object,
  remoteDispatcher: PropTypes.object
};