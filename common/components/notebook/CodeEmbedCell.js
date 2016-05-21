import React from 'react';

import IFrame from './IFrame';
import { EditButtonGroup } from './EditButtonGroup';
import CellMetadata from './CellMetadata';
import { editCell, deleteCell, stopEditCell, updateCell, moveCellUp, moveCellDown } from '../../actions/NotebookActions';


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
  }

  componentDidMount() {
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

  renderEditMode() {
    return (
      <div>
        <strong>Codebeispiel-Einstellungen</strong>
        <div className="form-group">
          <label className="form-control-label">Beispiel-ID</label>
          <input className="form-control" type="text" placeholer="ID..." onChange={this.onUpdateCell} value={this.props.cell.get('source')}/>
        </div>
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
    let metadata = <CellMetadata dispatch={dispatch} cellId={cell.get('id')} editing={editing} metadata={cell.get('metadata')} />;
    let editingClass = editing ? ' editing' : '';

    if (!(isAuthor && editing)) {
      content = null;
    } else {
      content = this.renderEditMode();
    }

    return (
      <div className={"codeembed-cell" + editingClass}>
        <EditButtonGroup editing={editing} onCellDown={this.onCellDown} onCellUp={this.onCellUp} onStopEdit={this.onStopEdit} onEdit={this.onEdit} onDelete={this.onDelete} />
        {metadata}
        {content}
        <IFrame lazy={true} className="" width={width} height={height} src={`/embed/${this.props.cell.get('source')}`} allowFullScreen={true} frameBorder="0" />
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