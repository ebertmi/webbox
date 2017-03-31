import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import { LogTableRow } from '../../components/admin/LogTableRow';
import * as AdminActions from '../../actions/AdminActions';
import { SearchBar } from '../../components/admin/SearchBar';

class LogOverview extends Component {

  onSearchQueryChange (newQuery) {
    // trigger change, if needed
    // update url query
    if (this.props.logOverview.pagesQuery.q === newQuery) {
      return;
    }
  }

  onSearchClick (query) {
    this.props.changeLogsSearch(query);
  }

  onResetSearchClick () {
    this.props.changeLogsSearch('');
  }

  renderSearch () {
    return (<SearchBar
      placeholderText="Nach Log suchen..."
      searchClickHandler={this.onSearchClick.bind(this)}
      changeSearchQuery={this.onSearchQueryChange.bind(this)}
      resetSearchHandler={this.onResetSearchClick.bind(this)}
      searchQuery={this.props.logOverview.pagesQuery.q} />);
  }

  renderTable() {
    return (
      <table className="table table-sm table-striped table-hover">
        <thead className="thead-inverse">
          <tr>
            <th>Event</th>
            <th>Nachricht</th>
            <th>Typ</th>
            <th>Zusätzliche Daten</th>
            <th>Zeitpunkt</th>
          </tr>
        </thead>
        <tbody>
          {this.props.logOverview.logs.map((log, index) => {
            return <LogTableRow key={index} data={log} />;
          })}
        </tbody>
      </table>
    );
  }

  render () {
    const content = this.renderTable();
    return (
      <PaginationContainer
          changePage={this.props.changeLogsPage}
          requestPage={this.props.requestLogsPage}
          pages={this.props.logOverview.pages}
          pagesQuery={this.props.logOverview.pagesQuery}
          location={this.props.location}>
        <h2>Letzte Events <small>({this.props.logOverview.count})</small></h2>
        {this.renderSearch()}
        <LoadingContainer isLoading={this.props.logOverview.isFetching}>
          {content}
        </LoadingContainer>
      </PaginationContainer>
    );
  }
}

export default connect(state => ({
  logOverview: state.logOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(LogOverview);