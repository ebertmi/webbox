import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Link, IndexLink } from 'react-router';

import { Alert } from '../../components/Alert';
import * as AdminActions from '../../actions/AdminActions';

function renderMessage(props) {
  return props.message != null ? <Alert type={props.message.type} message={props.message.content} /> : null;
}

function getWebboxVersion() {
  if (typeof window != "undefined") {
    return window.__WEBBOX_VERSION__;
  } else {
    'Version not available';
  }
}

function AdminApp(props) {
  return (
    <div className="dashboard container-fluid">
      <div className="row">
        <div className="col-md-12">
          <h1>Verwaltung <small style={{fontSize: "50%", float: "right"}}>Version: {getWebboxVersion()}</small></h1>
          <hr />
        </div>
      </div>
      <div className="row">
        <div className="col-md-2">
          <ul className="nav nav-pills nav-stacked card">
            <li className="nav-item">
              <IndexLink  to="/admin" className="nav-link" activeClassName="active">Übersicht</IndexLink >
            </li>
            <li className="nav-item">
              <Link to="/admin/courses" className="nav-link" activeClassName="active">Kurse</Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/documents" className="nav-link" activeClassName="active">Dokumente</Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/users" className="nav-link" activeClassName="active">Benutzer</Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/embeds" className="nav-link" activeClassName="active">Embeds</Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/authattempts" className="nav-link" activeClassName="active">Login-Überwachung</Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/recyclebin" className="nav-link" activeClassName="active">Gelöschte Elemente</Link>
            </li>
            <li>
              <Link to="/admin/mail" className="nav-link" activeClassName="active">Mail</Link>
            </li>
          </ul>
        </div>
        <div className="col-md-9 card p-t-1">
          {renderMessage(props)}
          {props.children}
        </div>
      </div>
    </div>
  );
}

export default connect(state => {
  return { message: state.dashboardApp.message};
},
dispatch => bindActionCreators(AdminActions, dispatch))(AdminApp);