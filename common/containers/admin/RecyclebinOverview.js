import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import { RecyclebinTableRow } from '../../components/admin/RecyclebinTableRow';
import * as AdminActions from '../../actions/AdminActions';

function renderTable (props) {
  return (
    <table className="table table-sm tabl-striped">
      <thead className="thead-inverse">
        <tr>
          <th>Model</th>
          <th>Benutzer-ID</th>
          <th>Daten</th>
          <th>Zeitpunkt</th>
        </tr>
      </thead>
      <tbody>
        {props.recyclebinOverview.entries.map((entry) => {
          return <RecyclebinTableRow key={entry.id} data={entry}/>;
        })}
      </tbody>
    </table>);
}

function RecyclebinOverview(props) {
  const content = renderTable(props);
  return (
    <PaginationContainer
        changePage={props.changeRecyclebinPage}
        requestPage={props.requestRecyclebinPage}
        pages={props.recyclebinOverview.pages}
        pagesQuery={props.recyclebinOverview.pagesQuery}
        location={props.location}>
      <h2>Gelöschte Elemente <small>({props.recyclebinOverview.count})</small></h2>
      <LoadingContainer isLoading={props.recyclebinOverview.isFetching}>
        {content}
      </LoadingContainer>
    </PaginationContainer>
  );
}

export default connect(state => ({
  recyclebinOverview: state.recyclebinOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(RecyclebinOverview);