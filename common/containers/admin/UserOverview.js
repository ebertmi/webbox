import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Loader } from '../../components/Loader';
import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import { UserTableRow } from '../../components/admin/UserTableRow';
import { SearchBar } from '../../components/admin/SearchBar';
import * as AdminActions from '../../actions/AdminActions';

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
              <td>Name oder E-Mail</td>
              <td>Sucht nach dem Namen oder der E-Mail-Adresse</td>
              <td><code>christian</code> oder <code>@stud.hs-coburg.de</code></td>
            </tr>
            <tr>
              <td>Aktive Benutzer</td>
              <td>Filtert nach dem Status der Aktivierung</td>
              <td><code>active: false</code> oder <code>active: true</code></td>
            </tr>
            <tr>
              <td>Verifizierte Benutzer</td>
              <td>Filtert nach dem Status der Account-Verifikation</td>
              <td><code>verified: false</code> oder <code>verified: true</code></td>
            </tr>
            <tr>
              <td>Semester</td>
              <td>Filtert nach dem Semester</td>
              <td><code>semester: SS16</code></td>
            </tr>
            <tr>
              <td>Rolle</td>
              <td>Filtert die Benutzer nach der angegebenen Rolle</td>
              <td><code>role: author</code> oder <code>role: admin</code></td>
            </tr>
          </tbody>
        </table>
        <p>
        Die Filter- bzw. Suchoptionen können zusätzlich kombiniert und mehrfach verwendet werden. Zum Beispiel kann nach Autoren und Administratoren gleichzeitig gesucht werden: <code>role: admin role: author</code>
        </p>
      </ModalBody>
      <ModalFooter>
        <button className="btn btn-secondary" onClick={props.toggle}>Schließen</button>
      </ModalFooter>
    </div>
  </Modal>
);

class UserOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      helpModalOpen: false
    };

    this.toggleSearchHelp = this.toggleSearchHelp.bind(this);
  }

  toggleSearchHelp () {
    this.setState({
      helpModalOpen: !this.state.helpModalOpen
    });
  }

  renderLoader() {
    return <Loader type="line-scale" />;
  }

  renderTable () {
    return (
      <table className="table table-sm table-striped table-hover">
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

  onSearchQueryChange (newQuery) {
    // trigger change, if needed
    // update url query
    if (this.props.userOverview.pagesQuery.q === newQuery) {
      return;
    }
  }

  onSearchClick (query) {
    this.props.changeUsersSearch(query);
  }

  onResetSearchClick () {
    this.props.changeUsersSearch('');
  }

  renderSearch () {
    return (<SearchBar
      placeholderText="Nach Benutzer suchen..."
      searchClickHandler={this.onSearchClick.bind(this)}
      changeSearchQuery={this.onSearchQueryChange.bind(this)}
      resetSearchHandler={this.onResetSearchClick.bind(this)}
      searchQuery={this.props.userOverview.pagesQuery.q}
      showHelpIcon={true}
      onSearchHelp={this.toggleSearchHelp}
    />);
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
        <h2>Benutzer <small>({this.props.userOverview.count})</small></h2>
        {this.renderSearch()}
        <SearchHelpModal isOpen={this.state.helpModalOpen} toggle={this.toggleSearchHelp}/>
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