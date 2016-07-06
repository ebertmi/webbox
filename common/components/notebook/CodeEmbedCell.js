import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';

import IFrame from './IFrame';
import { EditButtonGroup } from './EditButtonGroup';
import CellMetadata from './CellMetadata';
import { editCell, deleteCell, stopEditCell, updateCell, moveCellUp, moveCellDown } from '../../actions/NotebookActions';
import { sourceFromCell } from '../../util/nbUtil';
import { API } from '../../services';
import { Severity } from '../../models/severity';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class CodeEmbedCell extends React.Component {
  constructor(props) {
    super(props);

    // Bind callbacks to right context (this)
    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onStopEdit = this.onStopEdit.bind(this);
    this.onUpdateCell = this.onUpdateCell.bind(this);
    this.onCellUp = this.onCellUp.bind(this);
    this.onCellDown = this.onCellDown.bind(this);

    this.onShowCreateEmbed = this.onShowCreateEmbed.bind(this);
    this.onCancelCreateEmbed = this.onCancelCreateEmbed.bind(this);
    this.onFormDataChange = this.onFormDataChange.bind(this);
    this.onCreateEmbed = this.onCreateEmbed.bind(this);

    // Fast shouldComponentUpdate for immutable.js
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  /**
   * Set initial state
   */
  componentWillMount() {
    this.setState({
      showCreateEmbed: false,
      formData: {
        language: 'python3',
        embedType: 'sourcebox',
        name: ''
      },
      message: ''
    });
  }

  /**
   * Show the embed creation form
   */
  onShowCreateEmbed(e) {
    e.preventDefault();
    this.setState({
      showCreateEmbed: true
    });
  }

  /**
   * Hide/Cancel the embed creation
   */
  onCancelCreateEmbed(e) {
    e.preventDefault();
    this.setState({
      showCreateEmbed: false
    });
  }

  /**
   * Handles changes on the form data
   */
  onFormDataChange(e) {
    const name = e.target.name;
    const value = e.target.value;
    const newFormData = {};
    newFormData[name] = value;
    const formData = Object.assign({}, this.state.formData, newFormData);

    this.setState({formData: formData});
  }

  /**
   * Callback for creating an embed!
   * 1. Get form data
   * 2. Send request to server
   * 3. If successful change current id to the returned one
   * 3. If failed, show message
   */
  onCreateEmbed(e) {
    e.preventDefault();
    API.embed.createEmbed({}, this.state.formData).then(res => {
      if (!res.error) {
        // Successfully created a new embed, now update the cell and hide the form
        this.props.dispatch(updateCell(this.props.cell.get('id'), res.id));
        this.setState({
          showCreateEmbed: false
        });
      } else {
        this.context.messageList.showMessage(Severity.Error, res.error);
      }
    }).catch(err => {
      this.context.messageList.showMessage(Severity.Error, err);
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
  }

  onUpdateCell(e) {
    e.preventDefault();
    const value = e.target.value || '';
    this.props.dispatch(updateCell(this.props.cell.get('id'), value));
  }

  renderCreateEmbed() {
    return (
      <div>
        <strong>Neues Beispiel erstellen</strong>
        <div className="form-group">
          <label className="form-control-label">Sprache/Typ</label>
          <select className="form-control" name="language" onChange={this.onFormDataChange} value={this.state.formData.language}>
            <option value="python3">Python 3</option>
            <option value="python2">Python 2</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>
          <small className="text-muted">Spezifiziert die zu verwendente Sprache für das Beispiel. <code>python3</code> für Python3 und <code>python</code> für Python 2</small>
        </div>
        <div className="form-group">
          <label className="form-control-label">Name</label>
          <input className="form-control" type="text" placeholder="z. B. String Methoden" name="name" onChange={this.onFormDataChange} value={this.state.formData.name}/>
          <small className="text-muted">Name, der das Beispiel beschreibt. Dieser wird oben rechts angezeigt.</small>
        </div>
        <div className="form-group">
          <label className="form-control-label">Typ</label>
          <select className="form-control" name="embedType" onChange={this.onFormDataChange} value={this.state.formData.embedType}>
            <option value="sourcebox">Sourcebox (serverseitig)</option>
            <option value="skulpt">Skulpt (clientseitig, nur Python)</option>
          </select>
          <small className="text-muted">Der Typ eines Beispiels definiert mit welchem Mechanismus der Code ausgeführt wird. <em>sourcebox</em> wird serverseitig ausgeführt. <em>skulpt</em> erlaubt die clientseitige Ausführung von Python (3).</small>
        </div>
        <div className="form-group">
          <button className="btn btn-success btn-sm m-r-1" onClick={this.onCreateEmbed}>Erstellen</button>
          <button onClick={this.onCancelCreateEmbed} className="btn btn-danger btn-sm">Abbrechen</button>
        </div>
      </div>
    );
  }

  renderCreateEmbedButton() {
    return (
      <div className="form-group">
        <button onClick={this.onShowCreateEmbed} className="btn btn-primary btn-sm">Neues Beispiel</button>
        <p className="text-muted">Sie können hier direkt ein neues (leeres) Beispiel anlegen. Die ID des neu erzeugten Beispiels wird hier gleich eingefügt.</p>
      </div>
    );
  }

  renderEditMode() {
    let source = sourceFromCell(this.props.cell);

    let createForm = this.state.showCreateEmbed ? this.renderCreateEmbed() : this.renderCreateEmbedButton();

    return (
      <div className="col-xs-12">
        <strong>Codebeispiel-Einstellungen</strong>
        <div className="form-group">
          <label className="form-control-label">Beispiel-ID</label>
          <input className="form-control" type="text" placeholder="ID..." onChange={this.onUpdateCell} value={source}/>
        </div>
        <hr className="top-sep" />
        { createForm }
        <hr className="top-sep" />
        <strong>Vorschau</strong>
      </div>
    );
  }

  render() {
    const { cell, isAuthor, editing, dispatch } = this.props;
    const width = this.props.cell.getIn(['metadata', 'width']);
    const height = this.props.cell.getIn(['metadata', 'height']);
    let content;
    let metadata = <CellMetadata className="col-xs-12" dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />;
    let editingClass = editing ? ' editing' : '';

    let source = sourceFromCell(this.props.cell);
    let frame = source !== '' ? <IFrame lazy={true} className="col-xs-12" width={width} height={height} src={`/embed/${source}`} allowFullScreen={true} frameBorder="0" /> : <p>Keine ID angegeben.</p>;


    if (!(isAuthor && editing)) {
      content = null;
    } else {
      content = this.renderEditMode();
    }

    return (
      <div className={"codeembed-cell col-md-12 row" + editingClass}>
        <EditButtonGroup isAuthor={isAuthor} editing={editing} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        {content}
        {frame}
      </div>
    );
  }
}

CodeEmbedCell.propTypes = {
  cell: React.PropTypes.object.isRequired,
  isAuthor: React.PropTypes.bool.isRequired,
  editing: React.PropTypes.bool.isRequired,
  lazy: React.PropTypes.bool,
  cellIndex: React.PropTypes.number.isRequired
};

CodeEmbedCell.defaultProps = {
  lazy: true
};

CodeEmbedCell.contextTypes = {
  messageList: React.PropTypes.object
};