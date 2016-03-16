import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import { AuthAttemptTableRow } from '../../components/admin/AuthAttemptTableRow';
import * as AdminActions from '../../actions/AdminActions';

class AuthAttemptOverview extends Component {
  renderTable () {
    return (
      <table className="table table-sm tabl-striped">
        <thead className="thead-inverse">
          <tr>
            <th>Benutzer</th>
            <th>IP</th>
            <th>Zeitpunkt</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {this.props.authAttemptOverview.attempts.map((attempt, index) => {
            return <AuthAttemptTableRow key={index} data={attempt}/>;
          })}
        </tbody>
      </table>);
  }

  render () {
    const content = this.renderTable();
    return (
      <PaginationContainer
          changePage={this.props.changeAuthAttemptsPage}
          requestPage={this.props.requestAuthAttemptsPage}
          pages={this.props.authAttemptOverview.pages}
          pagesQuery={this.props.authAttemptOverview.pagesQuery}
          location={this.props.location}>
        <h2>Auffällige Loginversuche</h2>
        <LoadingContainer isLoading={this.props.authAttemptOverview.isFetching}>
          {content}
        </LoadingContainer>
      </PaginationContainer>
    );
  }
}

export default connect(state => ({
  authAttemptOverview: state.authAttemptOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(AuthAttemptOverview);