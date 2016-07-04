import React from 'react';

import { Time } from '../../Time';

/**
 * Displays and filters recent errors in a table
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
      detailViewActive: false,
      errorInDetail: null,
      errors: []
    };

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
  }

  componentWillUnmount() {
    this.props.insights.removeListener('newErrors', this.onChange);
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

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-xs-12">
            <h4>Die letzten Fehler</h4>
          </div>
          <div className="col-xs-12">
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
          <div className="col-xs-12">
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
                  console.info(err);
                  return (
                    <tr key={err.id}>
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
  errors: React.PropTypes.array,
  n: React.PropTypes.number
};

ErrorView.defaultProps = {
  errors: []
};