import React from 'react';
import { connect } from 'react-redux';

import { Time } from '../Time';
import Icon from '../Icon';
import * as NotebookActions from '../../actions/NotebookActions';

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
      return (
      <span className="metadata-item">
        <span className="metadata-sep">{'\u00a0//\u00a0'}</span>
        <Icon className="icon-control" name={iconName} title={titleText} onClick={this.toggleViewMode} />
      </span>
      );
    }

    return null;

  }

  renderButtons() {
    const editIconName = this.props.editable ? '' : 'edit';
    const editTitleText = this.props.editable ? 'Schließen' : 'Metadata bearbeiten';
    return (
      <span>
        <span className="metadata-sep">{'\u00a0//\u00a0'}</span>
        <span className="metadata-item  icon-control" onClick={this.toggleEditClicked} >
          <Icon name={editIconName} title={editTitleText} />
        </span>
        <span className="metadata-item icon-control" onClick={this.onUndo} >
          <Icon name="undo" title="Rückgängig" /> <sup>{this.props.undoStackSize}</sup>
        </span>
        {/*<span className="metadata-item icon-control" onClick={this.onRedo} >
          <Icon name="repeat" title="Wiederholen" /> <sup>{this.props.redoStackSize}</sup>
        </span>*/}
        <span className="metadata-item icon-control" onClick={this.props.onSave} >
          <Icon name="floppy-o" title="Speichern" />
        </span>
      </span>
    );
  }

  render() {
    const { isAuthor, editable, metadata, slug, course, id } = this.props;
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
                <select className="form-control" defaultValue={language} name="language" ref="languageField" onBlur={e => {}} title="Sprache" >
                  <option value="python-3">Python 3</option>
                  <option value="python-2">Python 2</option>
                  <option value="java-8">Java 8</option>
                  <option value="c-13">C</option>
                </select>
                <small>Spracheinstellung für dieses Dokument. Die Spracheinstellung wird für die ausführbaren Beispiele und die Metadaten benötigt. Die Sprache wird automatisch in die <em>kernelspec</em> und <em>language_info</em> übernommen (<em>Kompatibel zu Jupyter Notebook Format)</em>).</small>
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
              <label className={"col-sm-2 form-control-label"} ><Icon name="link" /> Zugehöriger Kurs</label>
              <div className={"col-sm-10"}>
                <input className={"form-control"} onChange={this.onUpdate} type="text" defaultValue={course} name="course" ref="courseField" onBlur={e => {}} title="Kurs-Slug" />
                <small>Angabe eines Kurses (Kurz-Link oder ID), um diese Document zuzuordnen. <strong>Eine Änderung am Kursnamen verschiebt keine Bilder.</strong></small>
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
            <Icon name="user" />{'\u00a0' + author}
          </span>
          <span className="metadata-sep">{'\u00a0//\u00a0'}</span>
          <span className="metadata-item">
            <Icon name="clock-o" />{'\u00a0 Zuletzt aktualisiert '}<Time value={date} locale="de" relative={true} />
          </span>
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
