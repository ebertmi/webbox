import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import { CourseTableRow } from '../../components/admin/CourseTableRow';
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
            <td><code>Programmieren 1</code></td>
          </tr>
          <tr>
            <td>Öffentlich</td>
            <td>Filtert nach dem Status der Veröffentlichung</td>
            <td><code>published: false</code> oder <code>published: true</code></td>
          </tr>
          <tr>
            <td>Beschreibung</td>
            <td>Sucht nach Wörtern in der Kursbeschreibung</td>
            <td><code>description: Python</code></td>
          </tr>
          <tr>
            <td>Slug</td>
            <td>Sucht nach der Kurz-Url</td>
            <td><code>slug: python-prog</code></td>
          </tr>
        </tbody>
      </table>
      <p>
        Die Filter- bzw. Suchoptionen können zusätzlich kombiniert und mehrfach verwendet werden. Zum Beispiel kann nach Status der Veröffentlichung und Beschreibung gleichzeitig gesucht werden: <code>published: false description: python</code>
      </p>
    </ModalBody>
    <ModalFooter>
      <button className="btn btn-secondary" onClick={props.toggle}>Schließen</button>
    </ModalFooter>
  </div>
</Modal>
);

class CourseOverview extends Component {
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
    if (this.props.courseOverview.pagesQuery.q === newQuery) {
      return;
    }
  }

  onSearchClick (query) {
    this.props.changeCoursesSearch(query);
  }

  onResetSearchClick () {
    this.props.changeCoursesSearch('');
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
      searchQuery={this.props.courseOverview.pagesQuery.q}
      showHelpIcon={true}
      onSearchHelp={this.toggleSearchHelp}
      />);
  }

  renderTable () {
    return (
      <table className="table table-sm table-striped table-hover">
          <thead className="thead-inverse">
            <tr>
              <th>Titel</th>
              <th>ID</th>
              <th>Beschreibung</th>
              <th>Autor</th>
              <th>Erstellt am</th>
              <th>Zuletzt verändert am</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {this.props.courseOverview.courses.map((course, index) => {
              return <CourseTableRow key={index} data={course}/>;
            })}
          </tbody>
        </table>);
  }

  renderNewCourseButton() {
    return (
      <div className="row table-search-bar">
        <div className="col-sm-6">
          <form className="form-inline">
            <div className="form-group">
              <a className="btn btn-success btn-sm" href="/course/create" >Neuen Kurs anlegen</a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  render () {
    const content = this.renderTable();
    return (
      <PaginationContainer
          changePage={this.props.changeCoursesPage}
          requestPage={this.props.requestCoursesPage}
          pages={this.props.courseOverview.pages}
          pagesQuery={this.props.courseOverview.pagesQuery}
          location={this.props.location}>
        <h2>Kurse <small>({this.props.courseOverview.count})</small></h2>
        { this.renderNewCourseButton() }
        { this.renderSearch() }
        <SearchHelpModal isOpen={this.state.helpModalOpen} toggle={this.toggleSearchHelp}/>
        <LoadingContainer isLoading={this.props.courseOverview.isFetching}>
          {content}
        </LoadingContainer>
      </PaginationContainer>
    );
  }
}

export default connect(state => ({
  courseOverview: state.courseOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(CourseOverview);
