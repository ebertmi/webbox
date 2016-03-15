import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {CourseTableRow} from '../../components/admin/CourseTableRow';
import * as AdminActions from '../../actions/AdminActions';

class UserOverview extends Component {
  componentDidMount() {
    // fetch courses from server
    this.props.requestCourses(this.props.courseOverview.coursesQuery.page, this.props.courseOverview.coursesQuery.limit);
  }


  render () {
    return (
      <div>
        <h2>Kursübersicht</h2>
        <table className="table table-sm tabl-striped">
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
        </table>
      </div>
    );
  }
}

export default connect(state => ({
  courseOverview: state.courseOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(UserOverview);