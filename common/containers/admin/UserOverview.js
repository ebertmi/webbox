import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Loader } from '../../components/Loader';
import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import {UserTableRow} from '../../components/admin/UserTableRow';
import * as AdminActions from '../../actions/AdminActions';

class UserOverview extends Component {
  renderLoader() {
    return <Loader type="line-scale" />;
  }

  renderTable () {
    return (
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
    );
  }

  render () {
    const content = this.renderTable();

    return (
      <PaginationContainer
        changePage={this.props.changeUsersPage}
        requestPage={this.props.requestUsersPage}
        pages={this.props.userOverview.pages}
        pagesQuery={this.props.userOverview.pagesQuery}
        location={this.props.location}>
        <h2>Benutzer</h2>
        <LoadingContainer isLoading={this.props.userOverview.isFetching}>
          {content}
        </LoadingContainer>
      </PaginationContainer>
    );
  }
}

export default connect(state => ({
  userOverview: state.userOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(UserOverview);