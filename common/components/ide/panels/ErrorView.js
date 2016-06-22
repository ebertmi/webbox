import React from 'react';

import { Time } from '../../Time';

export default class ErrorView extends React.Component {
  constructor(props) {
    super(props);

  }

  componentWillMount() {
    this.setState({
      detailViewActive: false,
      errorInDetail: null,
      errors: this.getRecentErrors()
    });
  }

  componentWillUnmount() {

  }

  getRecentErrors() {
    return this.props.errors.slice(-this.props.n).reverse();
  }

  render() {
    return (
      <div className="row">
      <div className="col-xs-12">
        <h4>Die letzten Fehler</h4>
      </div>
      <div className="col-xs-12">
        <form className="form-inline">
          <div className="form-group">
            <label className="sr-only" htmlFor="errorFilterCount">Anzahl</label>
            <select className="form-control form-control-sm" id="errorFilterCount">
              <option value="10">die letzten 10</option>
              <option value="15">die letzten 15</option>
              <option value="20">die letzten 20</option>
              <option value="50">die letzten 50</option>
              <option value="all">Alle (langsam)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="sr-only" htmlFor="errorFilterType">Fehlertyp</label>
            <input type="text" className="form-control form-control-sm" id="errorFilterType" placeholder="Fehlertyp"/>
          </div>
          <div className="form-group">
            <label className="sr-only" htmlFor="errorFilterName">Benutzername</label>
            <input type="text" className="form-control form-control-sm" id="errorFilterName" placeholder="Benutzername"/>
          </div>
          <button className="btn btn-success btn-sm">Filtern</button>
          <button className="btn btn-warning btn-sm">Zurücksetzen</button>
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
            {this.getRecentErrors().map((err) => {

              return (
                <tr key={err.id}>
                  <td>{err.type}</td>
                  <td><code>{err.message}</code></td>
                  <td><pre>{err.data.fileContent}</pre></td>
                  <td>in <strong>{err.data.file}</strong> <span>Zeile: {err.data.line}</span></td>
                  <td>{err.username}</td>
                  <td><Time value={new Date(err.timeStamp)} locale="de" relative={true} invalidDateString="Nicht verfügbar"></Time></td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
  errors: [],
  n: 10
};