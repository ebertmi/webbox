import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {UserTableRow} from '../../components/admin/UserTableRow';
import * as AdminActions from '../../actions/AdminActions';

class UserOverview extends Component {
  componentDidMount() {
    // fetch users from server
    this.props.requestUsers(this.props.userOverview.usersQuery.page, this.props.userOverview.usersQuery.limit);
  }

  render () {
    return (
      <div>
        <h2>Benutzer</h2>
        <table className="table table-sm tabl-striped">
          <thead className="thead-inverse">
            <tr>
              <th>Id</th>
              <th>E-Mail-Adresse</th>
              <th>Aktiviert</th>
              <th>Semester</th>
              <th>Letzer Login</th>
              <th>Verifiziert</th>
              <th>Rollen</th>
            </tr>
          </thead>
          <tbody>
            {this.props.userOverview.users.map((user, index) => {
              return <UserTableRow key={index} data={user}/>;
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default connect(state => ({
  userOverview: state.userOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(UserOverview);