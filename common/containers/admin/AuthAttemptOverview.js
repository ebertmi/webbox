import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import { AuthAttemptTableRow } from '../../components/admin/AuthAttemptTableRow';
import * as AdminActions from '../../actions/AdminActions';

function renderTable (props) {
  return (
    <table className="table table-sm tabl-striped">
      <thead className="thead-inverse">
        <tr>
          <th>Benutzer</th>
          <th>IP</th>
          <th>ID</th>
          <th>Zeitpunkt</th>
        </tr>
      </thead>
      <tbody>
        {props.authAttemptOverview.attempts.map((attempt, index) => {
          return <AuthAttemptTableRow key={index} data={attempt}/>;
        })}
      </tbody>
    </table>);
}

function renderDeleteAllButton(props) {
  return (
    <div className="row table-search-bar">
      <div className="col-sm-6">
        <form className="form-inline" onSubmit={e => e.preventDefault()}>
          <div className="form-group">
            <button className="btn btn-danger btn-sm" onClick={props.deleteAllAuthAttempts}>Alle Löschen</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuthAttemptOverview(props) {
  const content = renderTable(props);
  return (
    <PaginationContainer
        changePage={props.changeAuthAttemptsPage}
        requestPage={props.requestAuthAttemptsPage}
        pages={props.authAttemptOverview.pages}
        pagesQuery={props.authAttemptOverview.pagesQuery}
        location={props.location}>
      <h2>Auffällige Loginversuche <small>({props.authAttemptOverview.count})</small></h2>
      { renderDeleteAllButton(props) }
      <LoadingContainer isLoading={props.authAttemptOverview.isFetching}>
        {content}
      </LoadingContainer>
    </PaginationContainer>
  );
}

export default connect(state => ({
  authAttemptOverview: state.authAttemptOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(AuthAttemptOverview);