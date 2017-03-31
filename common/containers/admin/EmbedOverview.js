import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import { EmbedTableRow } from '../../components/admin/EmbedTableRow';
import * as AdminActions from '../../actions/AdminActions';
import { SearchBar } from '../../components/admin/SearchBar';

class EmbedOverview extends Component {

  onSearchQueryChange (newQuery) {
    // trigger change, if needed
    // update url query
    if (this.props.embedOverview.pagesQuery.q === newQuery) {
      return;
    }
  }

  onSearchClick (query) {
    this.props.changeEmbedsSearch(query);
  }

  onResetSearchClick () {
    this.props.changeEmbedsSearch('');
  }

  renderSearch () {
    return (<SearchBar
      placeholderText="Nach Beispiel suchen..."
      searchClickHandler={this.onSearchClick.bind(this)}
      changeSearchQuery={this.onSearchQueryChange.bind(this)}
      resetSearchHandler={this.onResetSearchClick.bind(this)}
      searchQuery={this.props.embedOverview.pagesQuery.q} />);
  }

  renderTable() {
    return (<table className="table table-sm table-striped table-hover">
      <thead className="thead-inverse">
        <tr>
          <th>Id</th>
          <th>Titel</th>
          <th>Sprache</th>
          <th>Autor</th>
          <th>Erstellt am</th>
          <th>Zuletzt verändert am</th>
          <th>Typ (Umgebung)</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>
        {this.props.embedOverview.embeds.map((embed, index) => {
          return <EmbedTableRow key={index} data={embed}/>;
        })}
      </tbody>
    </table>);
  }

  render () {
    const content = this.renderTable();
    return (
      <PaginationContainer
          changePage={this.props.changeEmbedsPage}
          requestPage={this.props.requestEmbedsPage}
          pages={this.props.embedOverview.pages}
          pagesQuery={this.props.embedOverview.pagesQuery}
          location={this.props.location}>
        <h2>Codebeispiele <small>({this.props.embedOverview.count})</small></h2>
        {this.renderSearch()}
        <LoadingContainer isLoading={this.props.embedOverview.isFetching}>
          {content}
        </LoadingContainer>
      </PaginationContainer>
    );
  }
}

export default connect(state => ({
  embedOverview: state.embedOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(EmbedOverview);