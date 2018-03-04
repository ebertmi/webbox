import React from 'react';
import PropTypes from 'prop-types';

import classnames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';

import optionManager from '../../models/options';
import BaseCell from './BaseCell';
import Icon from '../Icon';
import Editor from '../Editor';
import ImageGallery from './ImageGallery';
import CellMetadata from './CellMetadata';
import { EditButtonGroup } from './EditButtonGroup';

import { Toolbar, ActionItem } from '../Toolbar';
import { updateCell } from '../../actions/NotebookActions';
import { createModel } from '../../util/monacoUtils';
import Markdown from '../../util/markdown';

import {
  insert,
  appendAtEndOfLine,
  BoldItem,
  ItalicsItem,
  UlItem,
  OlItem,
  LinkItem,
  BlockquoteItem,
  InlineCodeItem,
  CodeBlockItem,
  ImageItem,
  ExtendedFormat
} from '../../util/mdUtil';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class MarkdownCell extends BaseCell {
  constructor(props) {
    super(props);

    this.onRef = this.onRef.bind(this);
    this.toggleImageGallery= this.toggleImageGallery.bind(this);

    // Markdown Commands
    this.onInsertImage = this.onInsertImage.bind(this);

    this.onBoldInsert = this.onEditorInsert.bind(this, BoldItem);
    this.onItalicsInsert = this.onEditorInsert.bind(this, ItalicsItem);
    this.onOrderedListInsert = this.onEditorInsert.bind(this, OlItem);
    this.onUnorderedListInsert = this.onEditorInsert.bind(this, UlItem);
    this.onLinkInsert = this.onEditorInsert.bind(this, LinkItem);
    this.onBlockquoteInsert = this.onEditorInsert.bind(this, BlockquoteItem);
    this.onInlineCodeInsert = this.onEditorInsert.bind(this, InlineCodeItem);
    this.onCodeBlockInsert = this.onEditorInsert.bind(this, CodeBlockItem);
    this.onExtendedFormatInsert = this.onExtendedFormatInsert.bind(this);

    this.saveCurrentSessionToState = this.saveCurrentSessionToState.bind(this);

    this.state = {
      rendered: '',
      showImageUpload: false,
      showImageGallery: false,
      options: optionManager.getOptions()
    };
  }

  componentDidMount() {
    const source = this.getSourceFromCell();
    this.renderMarkdown(source);
    optionManager.on('change', this.onChangeOption); 
  }

  componentWillUnmount() {
    optionManager.removeListener('change', this.onChangeOption);
  }

  /**
   * Renders marks down and sets the returned markup as state when finished.
   * @param {string} source - source to render
   * @returns {void}
   */
  renderMarkdown(source) {
    Markdown.render(source)
      .then((rendered) => {
        this.setState({
          rendered: rendered
        });
      });
  }

  saveCurrentSessionToState() {
    if (this.model) {
      const content = this.model.getValue();
      this.props.dispatch(updateCell(this.props.cell.get('id'), content));
    }
  }

  onChangeOption() {
    this.setState({
      options: optionManager.getOptions()
    });
  }

  /**
   * Saves the "source" property of a cell.
   * @returns {void}
   */
  onUpdateCell() {
    if (this.model) {
      const content = this.model.getValue();
      this.props.dispatch(updateCell(this.props.cell.get('id'), content));
      this.renderMarkdown(content);
    } else {
      console.warn('MarkdownCell.onSaveCellSource called with invalid session', this.model);
    }
  }

  onRef(node) {
    if (node) {
      this.renderedHeight = Math.min(Math.max(node.offsetHeight, node.scrollHeight, node.clientHeight, this.props.minHeight), BaseCell.MAX_EDITOR_HEIGHT);
    }
  }

  /**
   * Insert a new markdown image tag
   * @param {string} src - url of the image to include
   * @returns {void}
   */
  onInsertImage (src) {
    const customImageItem = cloneDeep(ImageItem);
    customImageItem.placeHolder = src;
    this.onEditorInsert(customImageItem);
  }

  toggleImageGallery() {
    const newState = this.state.showImageGallery ? false : true;

    // Save the current session, otherwise it will be overridden
    this.onUpdateCell();

    this.setState({
      showImageGallery: newState
    });
  }

  renderImageGallery() {
    if (this.state.showImageGallery === true) {
      return (
        <ImageGallery onInsertImage={this.onInsertImage} document={this.props.document} course={this.props.course} />
      );
    }

    return null;
  }

  /**
   * Insert Markdown-Format-Items in the editor. Uses the current selection if possible.
   *
   * @param {any} item - item to wrap
   * @returns {void}
   */
  onEditorInsert(item) {
    if (this.model) {
      insert(item, this.model, this.editor.editor);
    }

    // Focus editor
    if (this.editor) {
      this.editor.focus();
    }
  }

  onExtendedFormatInsert () {
    if (this.model) {
      appendAtEndOfLine(ExtendedFormat, this.model, this.editor.editor);
    }

    // Focus editor
    if (this.editor) {
      this.editor.focus();
    }
  }

  renderListToolbar() {
    return (<Toolbar className="notebook-toolbar" animated={true}>
      <ActionItem onClick={this.onUnorderedListInsert} isIcon={true} title="Liste">
        <Icon name="list-ul" />
      </ActionItem>
      <ActionItem onClick={this.onOrderedListInsert} isIcon={true} title="Nummerierte Liste">
        <Icon name="list-ol" />
      </ActionItem>
      <ActionItem onClick={this.onExtendedFormatInsert} isIcon={true} title="Erweiterte Formatierung einfügen">
        <Icon name="css3" />
      </ActionItem>
    </Toolbar>);
  }

  renderVariousToolbar() {
    return (<Toolbar className="notebook-toolbar" animated={true}>
      <ActionItem onClick={this.onBlockquoteInsert} isIcon={true} title="Zitat">
        <Icon name="quote-right" />
      </ActionItem>
      <ActionItem onClick={this.onInlineCodeInsert} isIcon={true} title="Code (Inline)">
        <Icon name="code" />
      </ActionItem>
      <ActionItem onClick={this.onCodeBlockInsert} isIcon={true} title="Code (Block)">
        <Icon name="file-code-o" />
      </ActionItem>
      <ActionItem onClick={this.onLinkInsert} isIcon={true} title="Link">
        <Icon name="link" />
      </ActionItem>
    </Toolbar>);
  }

  renderTextToolbar() {
    return (<Toolbar className="notebook-toolbar" animated={true}>
      <ActionItem onClick={this.onBoldInsert} isIcon={true} title="Fett (Starke Hervorhebung)">
        <Icon name="bold" />
      </ActionItem>
      <ActionItem onClick={this.onItalicsInsert} isIcon={true} title="Kursiv (Hervorhebung)">
        <Icon name="italic" />
      </ActionItem>
    </Toolbar>);
  }

  /**
   * Render the Editor for Markdown Editing
   *
   * @returns {void}
   */
  renderEditMode() {
    const minHeight = this.renderedHeight ? this.renderedHeight : this.props.minHeight;
    const source = this.getSourceFromCell();
    if (this.model) {
      this.model.setValue(source);
    } else {
      this.model = createModel('temp.md', source, 'markdown');
    }

    // ToDo: Render ToolBar, that inserts Markdown Code

    return (
      <div className="col-12" onKeyDown={this.onKeyDown}>
        { this.renderImageGallery() }
        <strong>Markdown</strong>  <Icon className="icon-control" onClick={this.toggleImageGallery} title="Verfügbare Bilder anzeigen" name="picture-o"/>
        { this.renderTextToolbar() }
        { this.renderVariousToolbar() }
        { this.renderListToolbar() }
        <Editor
          fontSize="1.3rem"
          minHeight={minHeight}
          options={this.state.options}
          file={{model: this.model}}
          ref={editor => this.editor = editor} 
        />
      </div>
    );
  }

  /**
   * Renders the view mode of the markdown cell. Basically, this is rendering the markdown as HTML.
   *
   * @returns {React.ReactNode} rendered view mode
   */
  renderViewMode() {
    return <div className="col-12 view-mode" data-viewnode={true} ref={this.onRef} dangerouslySetInnerHTML={{__html: this.state.rendered}}/>;
  }

  render() {
    const { cell, isEditModeActive, editing, dispatch } = this.props;
    let content;
    const metadata = <CellMetadata beforeChange={this.saveCurrentSessionToState} className="col-12" dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />;
    const editingClass = editing ? ' editing' : '';
    const isVisible = this.isVisible();

    if (!(isEditModeActive && editing)) {
      content = this.renderViewMode(isVisible);
    } else {
      content = this.renderEditMode();
    }

    const classes = classnames('markdown-cell col-12 row', editingClass, {
      'cell-not-visible': !isVisible
    });

    return (
      <div className={classes}>
        <EditButtonGroup isVisible={isVisible} isEditModeActive={isEditModeActive} editing={editing} onToggleVisibility={this.onToggleVisibility} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        {content}
      </div>
    );
  }
}

MarkdownCell.propTypes = {
  minHeight: PropTypes.number,
  cell: PropTypes.object.isRequired,
  isEditModeActive: PropTypes.bool.isRequired,
  editing: PropTypes.bool.isRequired,
  cellIndex: PropTypes.number.isRequired,
  course: PropTypes.string,
  document: PropTypes.string
};

MarkdownCell.defaultProps = {
  minHeight: 200
};
