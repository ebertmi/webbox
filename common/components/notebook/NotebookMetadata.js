import React from 'react';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import { Time } from '../Time';
import Icon from '../Icon';
import * as NotebookActions from '../../actions/NotebookActions';
import { EmbedTypes } from '../../constants/Embed';
import TaggedInput from '../TaggedInput';
import { API } from '../../services';

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
    this.toggleViewAnalytics = this.toggleViewAnalytics.bind(this);
    this.handleAuthorsChange = this.handleAuthorsChange.bind(this);

    this.state = {
      coursesInfo: []
    };
  }

  componentWillMount() {
    API.autocomplete.courses().then(resp => {
      if (resp.error) {
        console.error('Error occured');
      } else {
        this.setState({ coursesInfo: resp.coursesInfo });
      }
    });
  }

  onUpdate(e) {
    e.preventDefault();

    let name = e.target.name;
    let value = e.target.value;

    this.props.dispatch(NotebookActions.updateNotebookMetadata(name, value));
  }

  handleAuthorsChange(author, authors) {
    console.info('handleAuthorsChange', author, authors);
    this.props.dispatch(NotebookActions.updateNotebookMetadata('authors', new Immutable.List(authors)));
  }

  toggleEditClicked(e) {
    e.preventDefault();
    this.props.dispatch(NotebookActions.toggleNotebookMetadataEdit());
  }

  toggleViewMode(e) {
    e.preventDefault();
    this.props.dispatch(NotebookActions.toggleViewMode());
  }

  toggleViewAnalytics(e) {
    e.preventDefault();
    this.props.dispatch(NotebookActions.toggleViewAnalytics());
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
    const iconName = this.props.isEditModeActive ? 'toggle-off' : 'toggle-on';
    const titleText = this.props.isEditModeActive ? 'Leseansicht (Strg+Q)' : 'Editieransicht (Strg+Q)';

    const linkToPresentation = `/p/${this.props.id}`;

    let toggleViewModeButton = this.props.isAuthor === false ? null : (<ActionItem isIcon={true} title={titleText} onClick={this.toggleViewMode}>
          <Icon name={iconName} />
        </ActionItem>);

    let toggleViewAnalyticsButton = this.props.isAuthor === false ? null : (<ActionItem isIcon={true} title={'Diagramme Umschalten'} onClick={this.toggleViewAnalytics}>
          <Icon name="line-chart" />
        </ActionItem>);


    return (
      <Toolbar className="notebook-toolbar" animated={true}>
        {toggleViewModeButton}
        {toggleViewAnalyticsButton}
        <ActionItem isIcon={true} title="Präsentationsmodus (Strg+M)" href={linkToPresentation} target="_blank" >
          <Icon name="television" />
        </ActionItem>
      </Toolbar>
    );
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
        <ActionItem isIcon={true} title="Speichern (Strg+S)" onClick={this.props.onSave}>
          <Icon name="floppy-o" />
        </ActionItem>
      </Toolbar>
    );
  }

  render() {
    const { isEditModeActive, editable, metadata, slug, course, id, embedType, authors } = this.props;
    const author = metadata.get('author');
    const date = metadata.get('lastUpdate');
    const title = metadata.get('title');
    const language_name = metadata.getIn(['language_info', 'name']);
    const language_version = metadata.getIn(['language_info', 'version']);
    const language = `${language_name}-${language_version}`;

    let authorsArray = authors;

    if (authors == null) {
      authorsArray = [];
    } else {
      authorsArray = authors.toArray();
    }

    // Update document title (browser window)
    document.title = title;

    // Determine what text and icon we need to show
    const editIconName = editable ? '' : 'edit';
    const editTitleText = editable ? 'Schließen' : 'Metadata bearbeiten';

    if (editable) {
      return (
        <div className="col-md-12">
          <h1 className="notebook-title">{title}</h1>
          <h3>Metadaten:</h3>
          <div className="form-group row">
            <label className={"col-sm-2 form-control-label"} >Titel</label>
            <div className={"col-sm-10"}>
              <input className={"form-control title-field"} onChange={this.onUpdate} placeholder="Titel" type="text" defaultValue={title} name="title" ref="titleField" onBlur={e => {}} title="Notebook Titel" />
            </div>
          </div>
          <div className="notebook-metadata">
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
                <select defaultValue={course != undefined ? course : ''} ref="courseField" title="Kurs-Slug" onChange={this.onUpdate} className={"form-control custom-select"} name="course">
                  {this.state.coursesInfo.map(info => {
                    let infoStr = '' + info.title + ' (' + (info.published ? 'Veröffentlicht' : 'Nicht Veröffentlicht') + ')';
                    return <option value={info.slug} key={info.id}>{infoStr}</option>;
                  })}
                  <option value="">Nicht zugeordnet</option>
                </select>
                {/*<input className={"form-control"} onChange={this.onUpdate} type="text" defaultValue={course} name="course" ref="courseField" onBlur={e => {}} title="Kurs-Slug" />*/}
                <small>Angabe eines Kurses (Kurz-Link oder ID), um diese Document zuzuordnen. <strong>Eine Änderung am Kursnamen verschiebt keine Bilder.</strong></small>
                <input className={"form-control"} disabled readOnly type="text" defaultValue={this.props.id} name="notebookdid" />
                <small>Interne ID des Dokumentes.</small>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <label className={"col-sm-2 form-control-label"} ><Icon name="users" /> Weitere Autoren</label>
            <div className={"col-sm-10"}>
              <TaggedInput className={"form-control"} onAddTag={this.handleAuthorsChange} onRemoveTag={this.handleAuthorsChange} name="authors"ref="authorsField" placeholder="Weitere Autoren" tags={authorsArray} title="Mitautoren" />
              <small className="text-muted">Diese erhalten Bearbeitungsrechte für dieses Dokument.</small>
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
            <a href={`/export/d/${id}`} target="_blank">Export (ipynb)</a>
          </span>
        </div>
      );
    }
    return (
      <div className="col-xs-12 hidden-print">
        <h1 className="notebook-title">{title}</h1>
        <div className="notebook-metadata">
          <span className="metadata-item">
            <Icon name="user" />&nbsp;{author}
          </span>
          <span className="metadata-sep">&nbsp;&middot;&nbsp;</span>
          <span className="metadata-item">
            <Icon name="clock-o" />&nbsp;Zuletzt aktualisiert&nbsp;<Time value={date} locale="de" relative={true} />
          </span>
          <span className="metadata-sep">&nbsp;</span>
          { isEditModeActive ? this.renderButtons() : null }
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
