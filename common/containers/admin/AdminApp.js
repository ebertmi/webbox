'use strict';

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import { Link, IndexLink  } from 'react-router';

import * as AdminActions from '../../actions/AdminActions';

class AdminApp extends Component {
  renderMessage() {

  }

  render () {
    return (
      <div className="dashboard container-fluid">
        <div className="row">
          <div className="col-md-2">
            <ul className="nav nav-pills nav-stacked">
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
          <div className="col-md-8">
            <h1>Admin Dashboard with React</h1>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

AdminApp.propTypes = {
  error: React.PropTypes.any
};

export default connect(state => {
  return { message: state.dashboardApp.message};
},
dispatch => bindActionCreators(AdminActions, dispatch))(AdminApp);