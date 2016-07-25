import React from 'react';
import { connect } from 'react-redux';

import { Time } from '../Time';
import Icon from '../Icon';
import * as NotebookActions from '../../actions/NotebookActions';
import { EmbedTypes } from '../../constants/Embed';

import { Toolbar, ActionItem } from '../Toolbar';

/**
 * Displays the Notebook-Metadata with:
 *  - title
 *  - author
 *  - last update date
 *
 * And allows to edit:
 *  - author
 *  - title
 *  - slug
 */
class NotebookMetadata extends React.Component {

  constructor(props) {
    super(props);

    this.toggleEditClicked = this.toggleEditClicked.bind(this);
    this.onUndo = this.onUndo.bind(this);
    this.onRedo = this.onRedo.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.toggleViewMode = this.toggleViewMode.bind(this);
  }

  onUpdate(e) {
    e.preventDefault();

    let name = e.target.name;
    let value = e.target.value;

    this.props.dispatch(NotebookActions.updateNotebookMetadata(name, value));
  }

  toggleEditClicked(e) {
    e.preventDefault();
    this.props.dispatch(NotebookActions.toggleNotebookMetadataEdit());
  }

  toggleViewMode(e) {
    e.preventDefault();
    this.props.dispatch(NotebookActions.toggleViewMode());
  }

  onUndo(e) {
    e.preventDefault();
    this.props.dispatch(NotebookActions.undo());
  }

  onRedo(e) {
    e.preventDefault();
    this.props.dispatch(NotebookActions.redo());
  }

  onSave(e) {
    e.preventDefault();
    this.props.dispatch(NotebookActions.save());
  }

  renderViewMode() {
    if (this.props.canToggleEditMode) {
      const iconName = this.props.isAuthor ? 'toggle-off' : 'toggle-on';
      const titleText = this.props.isAuthor ? 'Leseansicht' : 'Editieransicht';

      const linkToPresentation = `/p/${this.props.id}`;

      return (
        <Toolbar className="notebook-toolbar" animated={false}>
          <ActionItem isIcon={true} title={titleText} onClick={this.toggleViewMode}>
            <Icon name={iconName} />
          </ActionItem>
          <ActionItem isIcon={true} title={titleText} href={linkToPresentation} target="_blank" >
            <Icon name="television" />
          </ActionItem>
        </Toolbar>
      );
    }

    return null;
  }

  renderButtons() {
    const editIconName = this.props.editable ? '' : 'edit';
    const editTitleText = this.props.editable ? 'Schließen' : 'Metadata bearbeiten';

    return (
      <Toolbar className="notebook-toolbar">
        <ActionItem isIcon={true} title={editTitleText} onClick={this.toggleEditClicked}>
          <Icon name={editIconName} />
        </ActionItem>
        <ActionItem isIcon={true} title="Rückgängig" onClick={this.onUndo}>
          <Icon name="undo" /> <sup>{this.props.undoStackSize}</sup>
        </ActionItem>
        {/*<ActionItem isIcon={true} title="Wiederholen" onClick={this.onRedo}>
          <Icon name="repeat" />
        </ActionItem>*/}
        <ActionItem isIcon={true} title="Speichern" onClick={this.props.onSave}>
          <Icon name="floppy-o" />
        </ActionItem>
      </Toolbar>
    );
  }

  render() {
    const { isAuthor, editable, metadata, slug, course, id, embedType } = this.props;
    const author = metadata.get('author');
    const date = metadata.get('lastUpdate');
    const title = metadata.get('title');
    const language_name = metadata.getIn(['language_info', 'name']);
    const language_version = metadata.getIn(['language_info', 'version']);
    const language = `${language_name}-${language_version}`;

    document.title = title;
    const editIconName = editable ? '' : 'edit';
    const editTitleText = editable ? 'Schließen' : 'Metadata bearbeiten';

    if (editable) {
      return (
        <div className="col-md-12">
          <h1>{title}</h1>
          <h3>Metadaten:</h3>
          <div className="form-group row">
            <label className={"col-sm-2 form-control-label"} >Titel</label>
            <div className={"col-sm-10"}>
              <input className={"form-control title-field"} onChange={this.onUpdate} placeholder="Titel" type="text" defaultValue={title} name="title" ref="titleField" onBlur={e => {}} title="Notebook Titel" />
            </div>
          </div>
          <div className="metadata">
            <div className="form-group row">
              <label className={"col-sm-2 form-control-label"} ><Icon name="language" /> Sprache</label>
              <div className={"col-sm-10"}>
                <select className="form-control" defaultValue={language} onChange={this.onUpdate} name="language" ref="languageField" onBlur={e => {}} title="Sprache" >
                  <option value="python-3">Python 3</option>
                  <option value="python-2">Python 2</option>
                  <option value="java-8">Java 8</option>
                  <option value="c-13">C</option>
                </select>
                <small>Spracheinstellung für dieses Dokument. Die Spracheinstellung wird für die ausführbaren Beispiele und die Metadaten benötigt. Die Sprache wird automatisch in die <em>kernelspec</em> und <em>language_info</em> übernommen (<em>Kompatibel zu Jupyter Notebook Format)</em>).</small>
              </div>
            </div>
            <div className="form-group row">
              <label className={"col-sm-2 form-control-label"}>Typ</label>
              <div className={"col-sm-10"}>
                <select className="form-control" name="embedType" onChange={this.onUpdate} defaultValue={embedType}>
                  <option value={EmbedTypes.Sourcebox}>Sourcebox (serverseitig)</option>
                  <option value={EmbedTypes.Skulpt}>Skulpt (clientseitig, nur Python)</option>
                </select>
                <small className="text-muted">Der Typ eines Beispiels definiert mit welchem Mechanismus der Code ausgeführt wird. <em>sourcebox</em> wird serverseitig ausgeführt. <em>skulpt</em> erlaubt die clientseitige Ausführung von Python (3).</small>
              </div>
            </div>
            <div className="form-group row">
              <label className={"col-sm-2 form-control-label"} ><Icon name="user" /> Autor</label>
              <div className={"col-sm-10"}>
                <input className={"form-control"} onChange={this.onUpdate} type="text" defaultValue={author} name="author" ref="authorField" onBlur={e => {}} title="Author" />
              </div>
            </div>
            <div className="form-group row">
              <label className={"col-sm-2 form-control-label"} ><Icon name="link" /> Kurzlink</label>
              <div className={"col-sm-10"}>
                <input className={"form-control"} onChange={this.onUpdate} type="text" defaultValue={slug} name="slug" ref="slugField" onBlur={e => {}} title="Slug/Kurzlink" />
              </div>
            </div>
            <div className="form-group row">
              <label className={"col-sm-2 form-control-label"} ><Icon name="bank" /> Zugehöriger Kurs</label>
              <div className={"col-sm-10"}>
                <input className={"form-control"} onChange={this.onUpdate} type="text" defaultValue={course} name="course" ref="courseField" onBlur={e => {}} title="Kurs-Slug" />
                <small>Angabe eines Kurses (Kurz-Link oder ID), um diese Document zuzuordnen. <strong>Eine Änderung am Kursnamen verschiebt keine Bilder.</strong></small>
              </div>
            </div>
            <div className="form-group row">
              <label className={"col-sm-2 form-control-label"} ><Icon name="cogs" /> Interne ID</label>
              <div className={"col-sm-10"}>
                <input className={"form-control"} disabled readOnly type="text" defaultValue={this.props.id} name="notebookdid" />
                <small>Interne ID des Dokumentes.</small>
              </div>
            </div>
          </div>
          <span className="metadata-item">
            <button className="btn btn-info btn-sm" onClick={this.toggleEditClicked}><Icon className={''} name={editIconName} title={editTitleText} /> {editTitleText}</button>
          </span>
          <span className="metadata-item pull-xs-right">
            <button className="btn btn-danger btn-sm" onClick={this.props.onDelete}><Icon className={''} name="times-circle-o" title="Dokument Löschen" /> Dokument löschen</button>
          </span>
          <hr/>
          <span className="metadata-item">
            <a href={`/export/d/${id}`} download={`${title}.ipynb`}>Export (ipynb)</a>
          </span>
        </div>
      );
    }
    return (
      <div className="col-md-12">
        <h1>{title}</h1>
        <div className="metadata">
          <span className="metadata-item">
            <Icon name="user" />&nbsp;{author}
          </span>
          <span className="metadata-sep">&nbsp;&middot;&nbsp;</span>
          <span className="metadata-item">
            <Icon name="clock-o" />&nbsp;Zuletzt aktualisiert&nbsp;<Time value={date} locale="de" relative={true} />
          </span>
          <span className="metadata-sep">&nbsp;&middot;&nbsp;</span>
          { isAuthor ? this.renderButtons() : null }
          { this.renderViewMode() }
        </div>
        <hr/>
      </div>
    );
  }

}

export default connect(state => {
  return { metadata: state.notebook.get('metadata') };
})(NotebookMetadata);
