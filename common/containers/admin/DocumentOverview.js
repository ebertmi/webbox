import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import { DocumentTableRow } from '../../components/admin/DocumentTableRow';
import * as AdminActions from '../../actions/AdminActions';
import { SearchBar } from '../../components/admin/SearchBar';

class DocumentOverview extends Component {
  onSearchQueryChange (newQuery) {
    // trigger change, if needed
    // update url query
    if (this.props.documentOverview.pagesQuery.q === newQuery) {
      return;
    }
  }

  onSearchClick (query) {
    this.props.changeDocumentsSearch(query);
  }

  onResetSearchClick () {
    this.props.changeDocumentsSearch('');
  }

  renderSearch () {
    return (<SearchBar
      placeholderText="Nach Beispiel suchen..."
      searchClickHandler={this.onSearchClick.bind(this)}
      changeSearchQuery={this.onSearchQueryChange.bind(this)}
      resetSearchHandler={this.onResetSearchClick.bind(this)}
      searchQuery={this.props.documentOverview.pagesQuery.q} />);
  }

  renderTable() {
    return (<table className="table table-sm tabl-striped">
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
        {this.props.documentOverview.documents.map((document, index) => {
          return <DocumentTableRow key={index} data={document}/>;
        })}
      </tbody>
    </table>);
  }

  render () {
    const content = this.renderTable();
    return (
      <PaginationContainer
          changePage={this.props.changeDocumentsPage}
          requestPage={this.props.requestDocumentsPage}
          pages={this.props.documentOverview.pages}
          pagesQuery={this.props.documentOverview.pagesQuery}
          location={this.props.location}>
        <h2>Dokumente <small>({this.props.documentOverview.count})</small></h2>
        {this.renderSearch()}
        <LoadingContainer isLoading={this.props.documentOverview.isFetching}>
          {content}
        </LoadingContainer>
      </PaginationContainer>
    );
  }
}

export default connect(state => ({
  documentOverview: state.documentOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(DocumentOverview);