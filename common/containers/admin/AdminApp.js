import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Link, IndexLink } from 'react-router';

import { Alert } from '../../components/Alert';
import * as AdminActions from '../../actions/AdminActions';

class AdminApp extends Component {
  renderMessage() {
    return this.props.message != null ? <Alert type={this.props.message.type} message={this.props.message.content} /> : null;
  }

  render () {
    return (
      <div className="dashboard container-fluid">
        <div className="row">
          <div className="col-md-12">
            <h1>Verwaltung</h1>
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
                <Link to="/admin/users" className="nav-link" activeClassName="active">Benutzer</Link>
              </li>
              <li className="nav-item">
                <Link to="/admin/embeds" className="nav-link" activeClassName="active">Embeds</Link>
              </li>
              <li className="nav-item">
                <Link to="/admin/authattempts" className="nav-link" activeClassName="active">Login-Überwachung</Link>
              </li>
            </ul>
          </div>
          <div className="col-md-9 card p-t-1">
            { this.renderMessage() }
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(state => {
  return { message: state.dashboardApp.message};
},
dispatch => bindActionCreators(AdminActions, dispatch))(AdminApp);