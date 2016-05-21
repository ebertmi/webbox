import React from 'react';

import MarkdownCell from './MarkdownCell';
import CodeEmbedCell from './CodeEmbedCell';
import RawCell from './RawCell';
import AddControls from './AddControls';
import NotebookMetadata from './NotebookMetadata';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class Notebook extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // ToDo: register saving and redo shortcuts!
  }

  onDrop(e) {
    e.preventDefault();

    // ToDo: add handling of uploading images :)
  }

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  renderCells() {
    const activeBlock = this.props.notebook.get('activeBlock');
    const isAuthor = this.props.notebook.get('isAuthor');
    const cells = this.props.notebook.get('cells');

    let blocks = [];
    let dispatch = this.props.dispatch;

    cells.map((cell, index) => {
      const id = cell.get('id');
      const isFirst = (index === 0);
      const isLast = (index === blocks.size - 1);

      blocks.push(
        <AddControls dispatch={dispatch} key={'add' + id} id={id} isAuthor={isAuthor} />
      );

      // push actual cell
      switch (cell.get('cell_type')) {
        case 'markdown':
          blocks.push(<MarkdownCell dispatch={dispatch} key={id} id={id} cell={cell} isAuthor={isAuthor} isFirst={isFirst} isLast={isLast} editing={id === activeBlock}/>);
          break;
        case 'codeembed':
          blocks.push(<CodeEmbedCell dispatch={dispatch} key={id} id={id} cell={cell} isAuthor={isAuthor} isFirst={isFirst} isLast={isLast} editing={id === activeBlock}/>);
          break;
        case 'raw':
          blocks.push(<RawCell dispatch={dispatch} key={id} id={id} cell={cell} isAuthor={isAuthor} isFirst={isFirst} isLast={isLast} editing={id === activeBlock}/>);
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
      <div className="notebook" onDragOver={this.onDragOver} onDrop={this.onDrop.bind(this) }>
        <NotebookMetadata redoStackSize={redoStackSize} undoStackSize={undoStackSize} editable={this.props.notebook.get('notebookMetadataEditable')} slug={this.props.notebook.get('slug')} />
        { this.renderCells() }
      </div>
    );
  }
}
