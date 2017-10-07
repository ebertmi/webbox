import React from 'react';
import PropTypes from 'prop-types';
import Ace, {EditSession} from 'ace';

import Editor from '../../Editor';
import optionManager from '../../../models/options';
import { Time } from '../../Time';

const modelist = Ace.require('ace/ext/modelist');
const FIXED_OPTIONS = {
  showPrintMargin: false
};

/**
 * Displays and filters recent errors in a table
 * Allows to view an error in detail with the associated file
 *
 * @export
 * @class ErrorView
 * @extends {React.Component}
 */
export default class ErrorView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      n: 10,
      filterType: '',
      filterUsername: '',
      isFiltering: false,
      errorInDetailSession: new EditSession(''),
      errorInDetail: null,
      errors: [],
      options: {}
    };

    this.onChangeOption = this.onChangeOption.bind(this);
    this.onFilterTypeChange = this.onFilterTypeChange.bind(this);
    this.onFilterUsernameChange = this.onFilterUsernameChange.bind(this);
    this.onCountChange = this.onCountChange.bind(this);
    this.onReset = this.onReset.bind(this);
    this.onFilter = this.onFilter.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  componentWillMount() {
    this.props.insights.on('newErrors', this.onChange);
    this.onChange();
    optionManager.on('change', this.onChangeOption);
    this.onChangeOption();
  }

  componentWillUnmount() {
    this.props.insights.removeListener('newErrors', this.onChange);
  }

  onChangeOption() {
    this.setState({
      options: optionManager.getOptions()
    });
  }

  onChange() {
    this.filterErrors();
  }

  onFilterTypeChange(e) {
    const value = e.target.value;

    this.setState({
      filterType: value,
      isFiltering: false
    });
  }

  onFilterUsernameChange(e) {
    const value = e.target.value;

    this.setState({
      filterUsername: value,
      isFiltering: false
    });
  }

  onCountChange(e) {
    const value = e.target.value;

    this.setState({
      n: value
    });
  }

  onReset(e) {
    e.preventDefault();

    this.setState({
      filterUsername: '',
      filterType: '',
      isFiltering: false
    });
  }

  onFilter(e) {
    e.preventDefault();
    this.setState({
      isFiltering: true
    });

    this.filterErrors();
  }

  highlightError(errorId, e) {
    if (errorId == this.state.errorInDetail) {
      return;
    }

    this.setState({
      errorInDetail: errorId
    });

    e.preventDefault();
  }

  // Async filtering
  filterErrors() {
    this.props.insights.filterErrors(this.state.n, {
      isActive: this.state.isFiltering,
      filterType: this.state.filterType,
      filterUsername: this.state.filterUsername
    }).then(res => {
      this.setState({
        errors: res
      });
    });
  }

  renderErrorInDetail() {
    if (this.state.errorInDetail != null) {
      // Get error
      let error = this.state.errors.find(val => {
        return val.id === this.state.errorInDetail;
      });

      if (error != null) {
        let {font, fontSize, ace: aceOptions} = this.state.options;
        this.state.errorInDetailSession.setValue(error.data.fileContent);

        // Update mode
        let mode = modelist.getModeForPath(error.data.file).mode;
        this.state.errorInDetailSession.setMode(mode);

        return (<div>
          <p className="text-muted">Detailansicht: {error.type} in <strong>{error.data.file}</strong> Zeile: {error.data.line} <Time value={new Date(error.timeStamp)} locale="de" relative={true} invalidDateString="Nicht verfügbar"></Time></p>
          <Editor
            minHeight="150px"
            fontFamily={`${font}, monospace`}
            fontSize={`${fontSize}pt`}
            {...aceOptions}
            {...FIXED_OPTIONS}
            session={this.state.errorInDetailSession}
            ref={editor => this.editor = editor}
          />
        </div>);
      } else {
        // No matching error found, may lost after filtering?
        return null;
      }
    } else {
      return null;
    }
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <h4>Die letzten Fehler</h4>
          </div>
          <div className="col-12">
            <form className="form-inline">
              <div className="form-group">
                <label className="sr-only" htmlFor="errorFilterCount">Anzahl</label>
                <select className="form-control form-control-sm" id="errorFilterCount" value={this.state.n} onChange={this.onCountChange}>
                  <option value="10">die letzten 10</option>
                  <option value="15">die letzten 15</option>
                  <option value="20">die letzten 20</option>
                  <option value="50">die letzten 50</option>
                  <option value="all">Alle (langsam)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Filteroptionen: </label>
              </div>
              <div className="form-group">
                <label className="sr-only" htmlFor="errorFilterType">Fehlertyp</label>
                <input type="text" className="form-control form-control-sm" id="errorFilterType" placeholder="Fehlertyp" value={this.state.filterType} onChange={this.onFilterTypeChange} />
              </div>
              <div className="form-group">
                <label className="sr-only" htmlFor="errorFilterName">Benutzername</label>
                <input type="text" className="form-control form-control-sm" id="errorFilterName" placeholder="Benutzername" value={this.state.filterUsername} onChange={this.onFilterUsernameChange}/>
              </div>
              <button className="btn btn-success btn-sm" onClick={this.onFilter} >Filtern</button>
              <button className="btn btn-warning btn-sm" disabled={!this.state.isFiltering} onClick={this.onReset} >Zurücksetzen</button>
            </form>
          </div>
          <div className="col-12">
            { this.renderErrorInDetail() }
          </div>
          <div className="col-12">
            <table className="table table-sm table-hover">
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Fehlertext</th>
                  <th>Fehlerstelle</th>
                  <th>Dateiname</th>
                  <th>Benutzer</th>
                  <th>Zeitpunkt</th>
                </tr>
              </thead>
              <tbody>
                {this.state.errors.map((err) => {
                  const className = err.id === this.state.errorInDetail ? 'table-active' : '';
                  return (
                    <tr className={className} key={err.id} data-errorid={err.id} onDoubleClick={this.highlightError.bind(this, err.id)}>
                      <td>{err.type}</td>
                      <td><code>{err.message}</code></td>
                      <td><pre>{err.data.errorHint}</pre></td>
                      <td>in <strong>{err.data.file}</strong> <span>Zeile: {err.data.line}</span></td>
                      <td title={err.username}>{err.userId}</td>
                      <td><Time value={new Date(err.timeStamp)} locale="de" relative={true} invalidDateString="Nicht verfügbar"></Time></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

ErrorView.propTypes = {
  errors: PropTypes.array,
  n: PropTypes.number
};

ErrorView.defaultProps = {
  errors: []
};