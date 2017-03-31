import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import { CourseTableRow } from '../../components/admin/CourseTableRow';
import * as AdminActions from '../../actions/AdminActions';
import { SearchBar } from '../../components/admin/SearchBar';

class CourseOverview extends Component {
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

  renderSearch () {
    return (<SearchBar
      placeholderText="Nach Beispiel suchen..."
      searchClickHandler={this.onSearchClick.bind(this)}
      changeSearchQuery={this.onSearchQueryChange.bind(this)}
      resetSearchHandler={this.onResetSearchClick.bind(this)}
      searchQuery={this.props.courseOverview.pagesQuery.q} />);
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
