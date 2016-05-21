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
  }

  toggleEditClicked(e) {
    e.preventDefault();
    this.props.dispatch(NotebookActions.toggleNotebookMetadataEdit());
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

  render() {
    const { editable, metadata, slug } = this.props;
    const author = metadata.get('author');
    const date = metadata.get('lastUpdate');
    const title = metadata.get('title');

    document.title = title;
    const editIconName = editable ? 'newspaper-o' : 'edit';
    const editTitleText = editable ? 'Zurück' : 'Metadata bearbeiten';

    if (editable) {
      return (
        <div className="notebook-header">
          <h3>Metadaten:</h3>
          <div className="form-group row">
            <label className={"col-sm-2 form-control-label"} >Titel</label>
            <div className={"col-sm-10"}>
              <input className={"form-control title-field"} placeholder="Titel" type="text" defaultValue={title} ref="titleField" onBlur={e => {}} title="Notebook Titel" />
            </div>
          </div>
          <div className="metadata">
            <div className="form-group row">
              <label className={"col-sm-2 form-control-label"} ><Icon name="user" /> Autor</label>
              <div className={"col-sm-10"}>
                <input className={"form-control"} type="text" defaultValue={author} ref="authorField" onBlur={e => {}} title="Author" />
              </div>
            </div>
            <div className="form-group row">
              <label className={"col-sm-2 form-control-label"} ><Icon name="link" /> Kurzlink</label>
              <div className={"col-sm-10"}>
                <input className={"form-control"} type="text" defaultValue={slug} ref="slugField" onBlur={e => {}} title="Slug/Kurzlink" />
              </div>
            </div>
          </div>
          <span className="metadata-item">
            <button className="btn btn-info btn-sm" onClick={this.toggleEditClicked}><Icon className={''} name={editIconName} title={editTitleText} /> {editTitleText}</button>
          </span>
          <hr/>
        </div>
      );
    }
    return (
      <div className="notebook-header">
        <h1>{title}</h1>
        <div className="metadata">
          <span className="metadata-item">
            <Icon name="user" />{'\u00a0' + author}
          </span>
          <span className="metadata-sep">{'\u00a0//\u00a0'}</span>
          <span className="metadata-item">
            <Icon name="clock-o" />{'\u00a0 Zuletzt aktualisiert'}<Time value={date} locale="de" relative={true} />
          </span>
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
          <span className="metadata-item icon-control" onClick={this.onSave} >
            <Icon name="floppy-o" title="Speichern" />
          </span>
        </div>
        <hr/>
      </div>
    );
  }

}

export default connect(state => {
  return { metadata: state.notebook.get('metadata') };
})(NotebookMetadata);
