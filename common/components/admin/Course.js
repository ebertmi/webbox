import React, {Component} from 'react';
import { Loader } from '../Loader';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { CourseForm } from './CourseForm';

import * as AdminActions from '../../actions/AdminActions';

class Course extends Component {
  constructor () {
    super();

  }

  componentDidMount () {
    // we can compare here for data fetching
    let course;
    let found = false;
    for (course of this.props.courseOverview.courses) {
      if (course.id === this.props.params.id) {
        // update state
        this.props.updateCourse(course);
        found = true;
        break;
      }
    }

    // check if course is already cached, but fetch if course isDirty (form changes)
    if (this.props.courseOverview.course && !this.props.courseOverview.course.isDirty && this.props.courseOverview.course.id == this.props.params.id) {
      found = true;
    }

    if (!found) {
      // fetch
      this.props.getCourse(this.props.params.id);
    }
  }
  renderCourse () {
    return <CourseForm save={this.props.saveCourse} delete={this.props.deleteCourse} onChange={this.props.updateCourseForm} course={this.props.courseOverview.course} />;
  }

  renderLoader () {
    return <Loader type="line-scale" />;
  }


  renderDeleteMessage () {
    return (
      <div>
        <p>Der Kurs wurde <strong>gelöscht</strong>!</p>
        <Link to="/admin/courses">Zurück zur Benutzerübersicht</Link>
      </div>
    );
  }

  render () {
    let content;
    if (this.props.courseOverview.course == null) {
      content = this.renderLoader();
    } else if (this.props.courseOverview.course.isDeleted === true) {
      content = this.renderDeleteMessage();
    } else {
      content = this.renderCourse();
    }

    return (
      <div>
          <h3><small>Kurse</small></h3>
          {content}
      </div>
    );
  }
}


export default connect(state => ({
  courseOverview: state.courseOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(Course);