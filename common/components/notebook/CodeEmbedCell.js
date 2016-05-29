import React from 'react';

import IFrame from './IFrame';
import { EditButtonGroup } from './EditButtonGroup';
import CellMetadata from './CellMetadata';
import { editCell, deleteCell, stopEditCell, updateCell, moveCellUp, moveCellDown } from '../../actions/NotebookActions';
import { sourceFromCell } from '../../util/nbUtil';

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class CodeEmbedCell extends React.Component {
  constructor(props) {
    super(props);

    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onStopEdit = this.onStopEdit.bind(this);
    this.onUpdateCell = this.onUpdateCell.bind(this);
    this.onCellUp = this.onCellUp.bind(this);
    this.onCellDown = this.onCellDown.bind(this);

    this.onShowCreateEmbed = this.onShowCreateEmbed.bind(this);
    this.onCancelCreateEmbed = this.onCancelCreateEmbed.bind(this);
  }

  componentWillMount() {
    this.setState({
      showCreateEmbed: false
    });
  }

  componentDidMount() {
  }

  onShowCreateEmbed(e) {
    e.preventDefault();
    this.setState({
      showCreateEmbed: true
    });
  }

  onCancelCreateEmbed(e) {
    e.preventDefault();
    this.setState({
      showCreateEmbed: false
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
  }

  onUpdateCell(e) {
    e.preventDefault();
    const value = e.target.value || '';
    this.props.dispatch(updateCell(this.props.cell.get('id'), value));
  }

  renderViewMode() {
  }

  renderCreateEmbed() {
    return (
      <div>
        <strong>Neues Beispiel erstellen</strong>
        <div className="form-group">
          <label className="form-control-label">Sprache/Typ</label>
          <input className="form-control" type="text" placeholer="python3" value={''}/>
          <small className="text-muted">Spezifiziert die zu verwendente Sprache für das Beispiel. <code>python3</code> für Python3 und <code>python</code> für Python 2</small>
        </div>
        <div className="form-group">
          <label className="form-control-label">Name</label>
          <input className="form-control" type="text" placeholer="z. B. String Methoden" value={''}/>
          <small className="text-muted">Name, der das Beispiel beschreibt. Dieser wird oben rechts angezeigt.</small>
        </div>
        <div className="form-group">
          <button className="btn btn-success btn-sm m-r-1">Erstellen</button>
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
          <input className="form-control" type="text" placeholer="ID..." onChange={this.onUpdateCell} value={source}/>
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
      <div className={"codeembed-cell row" + editingClass}>
        <EditButtonGroup editing={editing} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
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
  lazy: React.PropTypes.bool
};

CodeEmbedCell.defaultProps = {
  lazy: true
};