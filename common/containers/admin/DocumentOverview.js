import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import { DocumentTableRow } from '../../components/admin/DocumentTableRow';
import * as AdminActions from '../../actions/AdminActions';
import { SearchBar } from '../../components/admin/SearchBar';

import Modal from 'react-modal';
import ModalBody from '../../components/ModalBody';
import ModalFooter from '../../components/ModalFooter';
import ModalHeader from '../../components/ModalHeader';

const SearchHelpModal = props => (
  <Modal
  isOpen={props.isOpen}
  onRequestClose={props.toggle}
  shouldCloseOnOverlayClick={true}
  className={{
    base: 'modal-dialog modal-lg',
    afterOpen: 'show',
    beforeClose: ''
  }}

  overlayClassName={{
    base: 'modal-backdrop',
    afterOpen: 'show',
    beforeClose: ''
  }}
>
  <div className="modal-content">
    <ModalHeader toggle={props.toggle}>Such- und Filteroptionen</ModalHeader>
    <ModalBody>
      <p>Folgende Suchoptionen stehen zur Verfügung:</p>
      <table className="table">
        <thead>
          <tr>
            <th>Option</th>
            <th>Beschreibung</th>
            <th>Beispiel</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Name bzw. Title</td>
            <td>Sucht nach dem Title</td>
            <td><code>Hello World</code></td>
          </tr>
          <tr>
            <td>Autor</td>
            <td>Filtert nach dem Autor in den Metadaten</td>
            <td><code>author: Michael</code> oder <code>author: Ebert</code></td>
          </tr>
          <tr>
            <td>Kurz-Url</td>
            <td>Sucht nach der der Kurz-Url (slug)</td>
            <td><code>slug: hellp</code></td>
          </tr>
          <tr>
            <td>Programmiersprache</td>
            <td>Sucht nach der Programmiersprache in den Metadaten</td>
            <td><code>language: python</code></td>
          </tr>
          <tr>
            <td>Ausführungsumgebung</td>
            <td>Sucht nach der Ausführungsumgebung in den Metadaten</td>
            <td><code>type: sourcebox</code> oder <code>type: skulpt</code></td>
          </tr>
        </tbody>
      </table>
      <p>
        Die Filter- bzw. Suchoptionen können zusätzlich kombiniert und mehrfach verwendet werden.
      </p>
    </ModalBody>
    <ModalFooter>
      <button className="btn btn-secondary" onClick={props.toggle}>Schließen</button>
    </ModalFooter>
  </div>
</Modal>
);

class DocumentOverview extends Component {
  constructor(props) {
    super(props);

    this.state = {
      helpModalOpen: false
    }

    this.toggleSearchHelp = this.toggleSearchHelp.bind(this);
  }

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

  toggleSearchHelp () {
    this.setState({
      helpModalOpen: !this.state.helpModalOpen
    });
  }

  renderSearch () {
    return (<SearchBar
      placeholderText="Nach Beispiel suchen..."
      searchClickHandler={this.onSearchClick.bind(this)}
      changeSearchQuery={this.onSearchQueryChange.bind(this)}
      resetSearchHandler={this.onResetSearchClick.bind(this)}
      searchQuery={this.props.documentOverview.pagesQuery.q}
      showHelpIcon={true}
      onSearchHelp={this.toggleSearchHelp}
      />);
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
        <SearchHelpModal isOpen={this.state.helpModalOpen} toggle={this.toggleSearchHelp}/>
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