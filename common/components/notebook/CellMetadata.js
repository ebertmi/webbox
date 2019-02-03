import React from 'react';
import PropTypes from 'prop-types';

import Icon from '../Icon';
import { updateCellSlideType, updateCellMetadata } from '../../actions/NotebookActions';
import { Severity } from '../../models/severity';

const METAKEY_VALID = 'control-outline';
const METAKEY_INVALID = 'has-danger';

/**
 * Displays the associated metadata of a cell. Allows editing when enabled.
 *
 * ToDo: support the following default values:
 *  - collapsed (bool) Whether the cell's output container should be collapsed
 *  - autoscroll (bool|auto) Whether the cell's output is scrolled, unscrolled, or autoscrolled
 *  - deletable (bool)
 *  - format ('mime/type')
 *  - name (str) A name for the cell. Should be unique
 *  - tags (list of str) A list of string tags on the cell. Commas are not allowed in a tag
 */
export default class CellMetadata extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onSlideTypeChange = this.onSlideTypeChange.bind(this);
    this.onMetadataChange = this.onMetadataChange.bind(this);
    this.onAddMetadata = this.onAddMetadata.bind(this);
    this.onNewMetadataChange = this.onNewMetadataChange.bind(this);
    this.onDelete = this.onDelete.bind(this);

    this.state = {
      newKey: '',
      newValue: '',
      newValid: METAKEY_VALID
    };
  }

  callBeforeChange() {
    if (this.props.beforeChange) {
      this.props.beforeChange();
    }
  }

  onSlideTypeChange(e) {
    e.preventDefault();

    let newValue = e.target.value;

    this.callBeforeChange();
    this.props.dispatch(updateCellSlideType(this.props.cellId, newValue));
  }

  onMetadataChange(e) {
    e.preventDefault();

    let newValue = e.target.value;
    let name = e.target.name;

    if (name === '') {
      // no update!
      return;
    }

    this.callBeforeChange();
    this.props.dispatch(updateCellMetadata(this.props.cellId, name, newValue));
  }

  onNewMetadataChange(e) {
    e.preventDefault();

    let value = e.target.value;
    let name = e.target.name;
    let newValid;

    if (name === 'metadataKey') {
      if (this.props.metadata.get(value)) {
        newValid = METAKEY_INVALID;
      } else {
        newValid = METAKEY_VALID;
      }
      this.setState({
        newKey: value,
        newValid
      });
    } else {
      this.setState({
        newValue: value
      });
    }

  }

  onAddMetadata(e) {
    e.preventDefault();

    if (!this.state.newKey || !this.state.newValue) {
      return;
    }

    if (this.state.newKey === '') {
      return;
    }

    // ToDo: what happens when adding duplicate keys?
    if (this.state.newValid === METAKEY_INVALID) {
      this.context.messageList.showMessage(Severity.Error, `Ungültiger Schlüsselname: ${this.state.newKey}`);

      // no update!
      return;
    }

    this.callBeforeChange();
    this.props.dispatch(updateCellMetadata(this.props.cellId, this.state.newKey, this.state.newValue));

    // clear state
    this.setState({
      newKey: '',
      newValue: '',
      newValid: METAKEY_VALID
    });
  }

  onDelete(e) {
    e.preventDefault();
    const metadataKey = e.target.getAttribute('data-metakey');
    if (metadataKey === '') {
      return;
    }

    this.callBeforeChange();
    this.props.dispatch(updateCellMetadata(this.props.cellId, metadataKey, null));
  }

  renderEditing() {
    let slideType = this.props.metadata.getIn(['slideshow', 'slide_type']);
    let slideBgColor = this.props.metadata.getIn(['slideshow', 'bgColor'], 'primary');
    let metadata = this.props.metadata.remove('slideshow');
    let classes = 'cell-header ' + this.props.className;

    return (
      <div className={classes}>
        <strong>Slideshow</strong>
        <div className="form-group row">
          <label className="col-sm-2 form-control-label">Slide-Type</label>
          <div className="col-sm-8">
            <select name="slide_type" value={slideType} onChange={this.onSlideTypeChange}>
              <option value="slide">Folie</option>
              <option value="fragment">Fragment</option>
              <option value="">Standard</option>
              <option value="skip">Nicht anzeigen</option>
            </select>
            <p className="text-muted" style={{fontSize: '0.75rem', lineHeight: 1}}><em>Folie</em> erzeugt eine neue Folie; <em>Standard</em> wird auf der aktuellen Folie platziert; <em>Fragment</em> wird auf <kbd>→</kbd> eingeblendet; <em>Nicht anzeigen</em> wird nicht auf der Folie angezeigt.</p>
          </div>
        </div>
        {/*<div className="form-group row">
          <label className="col-sm-2 form-control-label">Background Color</label>
          <div className="col-sm-8">
            <input className="form-control form-control-sm" name="slideshow.bgColor" value={slideBgColor} onChange={this.onMetadataChange} />
          </div>
    </div>*/}
        <strong>Weitere Metadaten</strong>
        {metadata.entrySeq().map(entry => {
          return (
            <div key={entry[0]} className="form-group row">
              <label className="col-sm-2 form-control-label">{entry[0]}</label>
              <div className="col-sm-8">
                <input className="form-control form-control-sm" name={entry[0]} value={entry[1]} onChange={this.onMetadataChange} />
              </div>
              <div className="col-sm-2">
                <Icon className="icon-control" onClick={this.onDelete} data-metakey={entry[0]} name="times-circle-o" title={entry[0] + ' Löschen'} />
              </div>
            </div>
          );
        })}
        <div className={'form-group row ' + this.state.newValid}>
          <label className="col-sm-2 form-control-label"><input onChange={this.onNewMetadataChange} className="form-control form-control-sm" placeholder="Name" name="metadataKey" value={this.state.newKey} /></label>
          <div className="col-sm-8">
            <input onChange={this.onNewMetadataChange} className="form-control form-control-sm" placeholder="Wert" name="metadataValue" value={this.state.newValue} />
          </div>
          <div className="col-sm-2">
            <button onClick={this.onAddMetadata} className="btn btn-info btn-sm btn-round">+</button>
          </div>
        </div>
        <hr className="top-sep" />
      </div>
    );
  }

  renderView() {
    return null;
  }

  render() {
    return this.props.editing ? this.renderEditing() : this.renderView();
  }
}

CellMetadata.propTypes = {
  metadata: PropTypes.object.isRequired,
  cellId: PropTypes.string.isRequired
};

CellMetadata.contextTypes = {
  messageList: PropTypes.object,
  remoteDispatcher: PropTypes.object
};