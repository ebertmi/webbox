import React from 'react';

import MarkdownCell from './MarkdownCell';
import CodeEmbedCell from './CodeEmbedCell';
import RawCell from './RawCell';
import CodeCell from './CodeCell';
import AddControls from './AddControls';
import NotebookMetadata from './NotebookMetadata';

import { loadCellsFromIPYNB } from '../../util/nbUtil';
import { addCellsFromJS } from '../../actions/NotebookActions';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class Notebook extends React.Component {
  constructor(props) {
    super(props);

    this.onDrop = this.onDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
  }

  componentWillMount() {
    this.setState({
      isDragging: false
    });
  }

  componentDidMount() {
    // ToDo: register saving and redo shortcuts!
  }

  onDrop(e) {
    e.preventDefault();

    // handle uploading
    let files = e.dataTransfer.files;

    for (let i = 0; i < files.length; i++) {
      let file = files[i];

      // notebook format
      if (file.name && file.name.endsWith('.ipynb')) {
        let reader = new FileReader();

        reader.onload = () => {
          let {cells, language} = loadCellsFromIPYNB(reader.result);

          this.props.dispatch(addCellsFromJS(cells, language));
        };

        reader.readAsText(file);
      } else {
        // ToDo: handle images
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

    let blocks = [];
    let dispatch = this.props.dispatch;

    // iterate over the list mapping of index->cellId
    cellOrder.map((cellId, index) => {
      let cell = cells.get(cellId);
      const id = cell.get('id');

      blocks.push(
        <AddControls dispatch={dispatch} key={'add' + id}  cellIndex={index} id={id} isAuthor={isAuthor} />
      );

      // push actual cell
      switch (cell.get('cell_type')) {
        case 'markdown':
          blocks.push(<MarkdownCell dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isAuthor={isAuthor} editing={index === activeBlock}/>);
          break;
        case 'code':
          blocks.push(<CodeCell dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isAuthor={isAuthor} editing={index === activeBlock}/>);
          break;
        case 'codeembed':
          blocks.push(<CodeEmbedCell dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isAuthor={isAuthor}editing={index === activeBlock}/>);
          break;
        case 'raw':
          blocks.push(<RawCell dispatch={dispatch} key={id} cellIndex={index} id={id} cell={cell} isAuthor={isAuthor} editing={index === activeBlock}/>);
          break;
        default:
        //return null;
      }

    });

    blocks.push(
        <AddControls dispatch={dispatch} key="add-end" isAuthor={isAuthor} />
    );

    return blocks;
  }

  render() {
    const undoStackSize = this.props.notebook.get('undoStack').size;
    const redoStackSize = this.props.notebook.get('redoStack').size;

    return (
      <div data-drag={true} className="notebook" onDragOver={this.onDragOver} onDrop={this.onDrop.bind(this) }>
        <NotebookMetadata redoStackSize={redoStackSize} undoStackSize={undoStackSize} editable={this.props.notebook.get('notebookMetadataEditable')} slug={this.props.notebook.get('slug')} />
        { this.renderCells() }
      </div>
    );
  }
}