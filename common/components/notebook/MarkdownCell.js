import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import { EditSession, UndoManager } from 'ace';

import Icon from '../Icon';
import Editor from '../Editor';
import ImageUpload from './ImageUpload';
import ImageGallery from './ImageGallery';
import CellMetadata from './CellMetadata';
import { EditButtonGroup } from './EditButtonGroup';

import { editCell, deleteCell, stopEditCell, updateCell, moveCellUp, moveCellDown } from '../../actions/NotebookActions';

import Markdown from '../../util/markdown';
import { sourceFromCell } from '../../util/nbUtil';

const MAX_EDITOR_HEIGHT = 400;

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class MarkdownCell extends React.Component {
  constructor(props) {
    super(props);

    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onStopEdit = this.onStopEdit.bind(this);
    this.onUpdateCell = this.onUpdateCell.bind(this);
    this.onRef = this.onRef.bind(this);
    this.onCellUp = this.onCellUp.bind(this);
    this.onCellDown = this.onCellDown.bind(this);
    this.toggleImageUpload= this.toggleImageUpload.bind(this);
    this.toggleImageGallery= this.toggleImageGallery.bind(this);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);

    // Markdown Commands
    this.onInsertImage = this.onInsertImage.bind(this);
  }

  componentWillMount() {
    this.setState({
      rendered: '',
      showImageUpload: false,
      showImageGallery: false
    });
  }

  componentDidMount() {
    let source = sourceFromCell(this.props.cell);
    this.renderMarkdown(source);
  }

  /**
   * Renders marks down and sets the returned markup as state when finished.
   */
  renderMarkdown(source) {
    Markdown.render(source)
    .then((rendered) => {
      this.setState({
        rendered: rendered
      });
    });
  }

  onCellUp() {
    this.props.dispatch(moveCellUp(this.props.cellIndex));
  }

  onCellDown() {
    this.props.dispatch(moveCellDown(this.props.cellIndex));
  }

  onEdit(e) {
    e.preventDefault();
    this.props.dispatch(editCell(this.props.cellIndex));
  }

  onDelete(e) {
    e.preventDefault();
    this.props.dispatch(deleteCell(this.props.cellIndex));
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
      console.warn('MarkdownCell.onSaveCellSource called with invalid session', this.session);
    }
  }

  onRef(node) {
    if (node) {
      this.renderedHeight = Math.min(Math.max(node.offsetHeight, node.scrollHeight, node.clientHeight, this.props.minHeight), MAX_EDITOR_HEIGHT);
    }
  }

  /**
   * Insert a new markdown image tag
   */
  onInsertImage (src) {
    if (this.session) {
      this.session.insert({
        row: this.session.getLength(),
        column: 0
      }, "\n" + `![](${src})`);
    }
  }

  toggleImageUpload() {
    let newState = this.state.showImageUpload ? false : true;
    this.setState({
      showImageUpload: newState
    });
  }

  toggleImageGallery() {
    let newState = this.state.showImageGallery ? false : true;
    this.setState({
      showImageGallery: newState
    });
  }

  renderImageGallery() {
    if (this.state.showImageGallery === true) {
      return (
        <ImageGallery onInsertImage={this.onInsertImage} course={this.props.course} />
      );
    }

    return null;
  }

  renderImageUploader() {
    if (this.state.showImageUpload === true) {
      return (
        <ImageUpload onInsertImage={this.onInsertImage} course={this.props.course} />
      );
    }

    return null;
  }

  renderEditMode() {
    let minHeight = this.renderedHeight ? this.renderedHeight : this.props.minHeight;
    let source = sourceFromCell(this.props.cell);
    if (this.session) {
      this.session.setValue(source);
    } else {
      this.session = new EditSession(source, 'ace/mode/markdown');
      this.session.setUndoManager(new UndoManager);
    }

    return (
      <div className="col-xs-12">
        <strong>Markdown</strong> <Icon className="icon-control" onClick={this.toggleImageUpload} title="Bilderupload anzeigen/schließen" name="cloud-upload"/> <Icon className="icon-control" onClick={this.toggleImageGallery} title="Verfügbare Bilder anzeigen" name="picture-o"/>
        { this.renderImageUploader() }
        { this.renderImageGallery() }
        <Editor fontSize="16px" minHeight={minHeight} maxLines={100} session={this.session} ref={editor => this.editor = editor} />
      </div>
    );
  }

  renderViewMode() {
    return <div className="col-xs-12 view-mode" data-viewnode={true} ref={this.onRef} dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
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
      <div className={"markdown-cell col-md-12 row " + editingClass}>
        <EditButtonGroup isAuthor={isAuthor} editing={editing} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        {content}
      </div>
    );
  }
}

MarkdownCell.propTypes = {
  minHeight: React.PropTypes.number,
  cell: React.PropTypes.object.isRequired,
  isAuthor: React.PropTypes.bool.isRequired,
  editing: React.PropTypes.bool.isRequired,
  cellIndex: React.PropTypes.number.isRequired
};

MarkdownCell.defaultProps = {
  minHeight: 200
};
