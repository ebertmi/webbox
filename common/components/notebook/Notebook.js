import React from 'react';
import classnames from 'classnames';

import MarkdownCell from './MarkdownCell';
import CodeEmbedCell from './CodeEmbedCell';
import RawCell from './RawCell';
import CodeCell from './CodeCell';
import AddControls from './AddControls';
import NotebookMetadata from './NotebookMetadata';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';

import { MessageListModel, MessageWithAction } from '../../models/messages';
import { Action } from '../../models/actions';
import { Severity } from '../../models/severity';
import { MessageList } from '../messageList/messageList';

import { loadCellsFromIPYNB, stateToJS, replaceIdWithSlug } from '../../util/nbUtil';
import { addCellsFromJS, toggleViewMode } from '../../actions/NotebookActions';

import { API } from '../../services';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class Notebook extends React.Component {
  constructor(props) {
    super(props);

    // Create global message list
    this.messageList = new MessageListModel();

    this.onDrop = this.onDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onToggleViewMode = this.onToggleViewMode.bind(this);

    this.state = {
      isDragging: false
    };
  }

  // Make messageList available in the tree
  getChildContext() {
    return {
      messageList: this.messageList
    };
  }

  componentDidMount() {
    // handle Ctrl+S on the whole document even when nothing is focused
    document.addEventListener('keydown', this.onKeyDown);

    // Try to update url
    replaceIdWithSlug(this.props.notebook);
  }

  /**
   * Check for Ctrl+S and try to save the document if possible
   */
  onKeyDown(e) {
    let key = e.which || e.keyCode;
    if ((e.metaKey || (e.ctrlKey && !e.altKey)) && key === 83) {
      // Pressed Ctrl-S for saving
      if (this.props.notebook.get('canToggleEditMode', false)) {
        this.onSave();
      }
      e.preventDefault();
    } else if ((e.metaKey || (e.ctrlKey && !e.altKey)) && key === 77) {
      // Pressed Ctrl+M to open the presentation
      this.onPresentationMode();
    } else if ((e.metaKey || (e.ctrlKey && !e.altKey)) && key === 81) {
      // Pressed Ctrl-Q to toggle view mode
      if (this.props.notebook.get('canToggleEditMode', false)) {
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
      } else {
        console.log(res);
        this.messageList.showMessage(Severity.Error, res.error);
      }
    }).catch(err => {
      this.messageList.showMessage(Severity.Error, err);
    });
  }

  onDelete() {
    const id = this.props.notebook.get('id');
    let messageObj;
    let deleteAction = new Action('delete.delete.action', 'Löschen', '', true, () => {
      API.document.delete({ id: id }).then(res => {
        if (!res.error) {
          // Redirect to main page
          window.location.replace(`${window.location.protocol}//${window.location.host}`);
        } else {
          console.log(res);
          this.messageList.showMessage(Severity.Error, res.error);
        }
      }).catch(err => {
        this.messageList.showMessage(Severity.Error, err);
      });

      // Hide message
      this.messageList.hideMessage(messageObj);
    });

    let cancelAction = new Action('cancel.delete.document', 'Abbrechen', '', true, () => {
      this.messageList.hideMessage(messageObj);
    });

    messageObj = new MessageWithAction('Wollen Sie das Dokument wirklich löschen? Sie können davor das Dokument auch exportieren.', [deleteAction, cancelAction]);

    this.messageList.showMessage(Severity.Warning, messageObj);
  }


  onDrop(e) {
    e.preventDefault();
    let target = e.target;

    // Stop image upload drops bubbling up, here
    if (target.getAttribute('data-name') === 'image-upload') {
      return;
    }

    // handle uploading
    let files = e.dataTransfer.files;

    for (let i = 0; i < files.length; i++) {
      let file = files[i];

      // notebook format
      if (file.name && file.name.endsWith('.ipynb')) {
        this.messageList.showMessage(Severity.Ignore, `Importiere ${file.name}... Dies kann einen Moment dauern.`);
        let reader = new FileReader();

        reader.onload = () => {
          let result = loadCellsFromIPYNB(reader.result);

          // Check if an error as occured during parsing the file!
          if (result instanceof Error) {
            this.messageList.showMessage(Severity.Error, result);
            return;
          }

          let {cells, language} = result;

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
    console.log('onDragEnter', e.target);
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
    const isAuthor = this.props.notebook.get('isAuthor');
    const cells = this.props.notebook.get('cells');
    const cellOrder = this.props.notebook.get('cellOrder');
    const notebookId = this.props.notebook.get('id');
    const course = this.props.notebook.get('course');
    const embedType = this.props.notebook.get('embedType');
    const notebookLanguage = this.props.notebook.getIn(['metadata', 'language_info', 'name'], 'plain');

    let blocks = [];
    let dispatch = this.props.dispatch;

    // iterate over the list mapping of index->cellId
    cellOrder.map((cellId, index) => {
      let cell = cells.get(cellId);
      const id = cell.get('id');

      if (isAuthor) {
        blocks.push(
          <AddControls dispatch={dispatch} key={'add' + id}  cellIndex={index} id={id} isAuthor={isAuthor} />
        );
      }

      // push actual cell
      switch (cell.get('cell_type')) {
        case 'markdown':
          blocks.push(<MarkdownCell document={notebookId} course={course} dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isAuthor={isAuthor} editing={index === activeBlock}/>);
          break;
        case 'code':
          blocks.push(<CodeCell  embedType={embedType} course={course} notebookLanguage={notebookLanguage} dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isAuthor={isAuthor} editing={index === activeBlock}/>);
          break;
        case 'codeembed':
          blocks.push(<CodeEmbedCell course={course} dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isAuthor={isAuthor}editing={index === activeBlock}/>);
          break;
        case 'raw':
          blocks.push(<RawCell dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isAuthor={isAuthor} editing={index === activeBlock}/>);
          break;
        default:
        //return null;
      }

    });

    if (isAuthor) {
      blocks.push(
          <AddControls dispatch={dispatch} key="add-end" isAuthor={isAuthor} />
      );
    }

    return blocks;
  }

  render() {
    const undoStackSize = this.props.notebook.get('undoStack').size;
    const redoStackSize = this.props.notebook.get('redoStack').size;
    const course = this.props.notebook.get('course');
    const embedType = this.props.notebook.get('embedType');
    const id = this.props.notebook.get('id');

    // Is the Notebook Metadata editable?
    const editable = this.props.notebook.get('notebookMetadataEditable');

    // Is Author, renders the edit buttons or the view mode
    const isAuthor = this.props.notebook.get('isAuthor');

    const classes = classnames("notebook row", {
      'view-mode': !isAuthor
    });

    const analyticsDashboard = this.props.notebook.get('showAnalytics') ? <AnalyticsDashboard notebook={this.props.notebook} /> : null;

    return (
      <div data-drag={true} className={classes} onDragOver={this.onDragOver} onDrop={this.onDrop}>
        <div className="global-message-list">
          <MessageList messageList={this.messageList} />
        </div>
        <NotebookMetadata
        canToggleEditMode={this.props.notebook.get('canToggleEditMode')}
        isAuthor={isAuthor}
        onSave={this.onSave}
        onDelete={this.onDelete}
        redoStackSize={redoStackSize}
        undoStackSize={undoStackSize}
        editable={editable}
        slug={this.props.notebook.get('slug')}
        course={course}
        embedType={embedType}
        id={id} />
        { analyticsDashboard }
        { this.renderCells() }
      </div>
    );
  }
}

Notebook.childContextTypes = {
  messageList: React.PropTypes.object
};