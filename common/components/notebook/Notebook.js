import React from 'react';

import MarkdownCell from './MarkdownCell';
import CodeEmbedCell from './CodeEmbedCell';
import RawCell from './RawCell';
import CodeCell from './CodeCell';
import AddControls from './AddControls';
import NotebookMetadata from './NotebookMetadata';

import { MessageListModel, MessageWithAction } from '../../models/messages';
import { Action } from '../../models/actions';
import { Severity } from '../../models/severity';
import { MessageList } from '../messageList/messageList';

import { loadCellsFromIPYNB, stateToJS } from '../../util/nbUtil';
import { addCellsFromJS } from '../../actions/NotebookActions';

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
  }

  // Make messageList available in the tree
  getChildContext() {
    return {
      messageList: this.messageList
    };
  }

  componentWillMount() {
    this.setState({
      isDragging: false
    });
  }

  componentDidMount() {
    // ToDo: register saving and redo shortcuts!
  }

  onSave() {
    const documentObj = stateToJS(this.props.notebook);
    API.document.save({ id: documentObj.id }, { document: documentObj }).then(res => {
      if (!res.error) {
        this.messageList.showMessage(Severity.Info, 'Erfolgreich gespeichert.');
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
        this.messageList.showMessage(Severity.Info, `Importiere ${file.name}... Dies kann einen Moment dauern.`);
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
            this.messageList.showMessage(Severity.Info, 'Daten wurden importiert.');
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
    const course = this.props.notebook.get('course');

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
          blocks.push(<MarkdownCell course={course} dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isAuthor={isAuthor} editing={index === activeBlock}/>);
          break;
        case 'code':
          blocks.push(<CodeCell course={course} dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isAuthor={isAuthor} editing={index === activeBlock}/>);
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

    return (
      <div data-drag={true} className="notebook row" onDragOver={this.onDragOver} onDrop={this.onDrop.bind(this) }>
        <div className="global-message-list">
          <MessageList messageList={this.messageList} />
        </div>
        <NotebookMetadata
        canToggleEditMode={this.props.notebook.get('canToggleEditMode')}
        isAuthor={this.props.notebook.get('isAuthor')}
        onSave={this.onSave}
        onDelete={this.onDelete}
        redoStackSize={redoStackSize}
        undoStackSize={undoStackSize}
        editable={this.props.notebook.get('notebookMetadataEditable')}
        slug={this.props.notebook.get('slug')}
        course={course} />
        { this.renderCells() }
      </div>
    );
  }
}

Notebook.childContextTypes = {
  messageList: React.PropTypes.object
};