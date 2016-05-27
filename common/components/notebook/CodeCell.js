import React from 'react';
import Markdown from '../../util/markdown';
import Editor from '../Editor';
import CellMetadata from './CellMetadata';
import { EditSession } from 'ace';

import { editCell, deleteCell, stopEditCell, updateCell, moveCellUp, moveCellDown } from '../../actions/NotebookActions';
import { EditButtonGroup } from './EditButtonGroup';


/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class CodeCell extends React.Component {
  constructor(props) {
    super(props);

    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onStopEdit = this.onStopEdit.bind(this);
    this.onUpdateCell = this.onUpdateCell.bind(this);
    this.onRef = this.onRef.bind(this);
    this.onCellUp = this.onCellUp.bind(this);
    this.onCellDown = this.onCellDown.bind(this);
  }

  componentWillMount() {
    this.setState({
      rendered: ''
    });
  }

  componentDidMount() {
    this.renderMarkdown(this.props.cell.get('source'));
  }

  /**
   * Renders marks down and sets the returned markup as state when finished.
   */
  renderMarkdown(source) {
    let mode = this.props.cell.getIn(['metadata', 'mode'], '');
    const codeSource = '```' + mode + '\n' + source + '\n```';
    Markdown.render(codeSource)
    .then((rendered) => {
      this.setState({
        rendered: rendered
      });
    });
  }

  onCellUp() {
    this.props.dispatch(moveCellUp(this.props.cell.get('id')));
  }

  onCellDown() {
    this.props.dispatch(moveCellDown(this.props.cell.get('id')));
  }

  onEdit(e) {
    e.preventDefault();
    this.props.dispatch(editCell(this.props.cell.get('id')));
  }

  onDelete(e) {
    e.preventDefault();
    this.props.dispatch(deleteCell(this.props.cell.get('id')));
  }

  onStopEdit(e) {
    e.preventDefault();
    this.props.dispatch(stopEditCell());
    this.onUpdateCell();
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
    let source = this.props.cell.get('source');
    let mode = this.props.cell.getIn(['metadata', 'mode']);
    this.session = new EditSession(source, 'ace/mode/' + mode);
    return (
      <div className="col-xs-12">
        <strong>Code</strong>
        <Editor onBlur={this.onStopEdit} minHeight={minHeight} maxLines={100} session={this.session} ref={editor => this.editor = editor} />
      </div>
    );
  }

  renderViewMode() {
    return <div className="col-xs-12" ref={this.onRef} dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
  }

  render() {
    const { cell, isAuthor, editing, dispatch } = this.props;
    let content;
    let metadata = <CellMetadata className="col-xs-12" dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />;
    let editingClass = editing ? ' editing' : '';

    if (!(isAuthor && editing)) {
      content = this.renderViewMode();
    } else {
      content = this.renderEditMode();
    }

    return (
      <div className={"code-cell row " + editingClass}>
        <EditButtonGroup editing={editing} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        {content}
      </div>
    );
  }
}

CodeCell.propTypes = {
  minHeight: React.PropTypes.number,
  cell: React.PropTypes.object.isRequired,
  isAuthor: React.PropTypes.bool.isRequired,
  editing: React.PropTypes.bool.isRequired
};

CodeCell.defaultProps = {
  minHeight: 200
};
