import React, {Component} from 'react';
import { Loader } from '../Loader';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { bindActionCreators } from 'redux';
import { UserForm } from './UserForm';

import * as AdminActions from '../../actions/AdminActions';

class User extends Component {
  constructor () {
    super();

  }

  componentDidMount () {
    // we can compare here for data fetching
    let user;
    let found = false;
    for (user of this.props.userOverview.users) {
      if (user.id === this.props.params.id) {
        // update state
        this.props.updateUser(user);
        found = true;
        break;
      }
    }

    // check if user is already cached, but fetch if user isDirty (form changes)
    if (this.props.userOverview.user && !this.props.userOverview.user.isDirty && this.props.userOverview.user.id == this.props.params.id) {
      found = true;
    }

    if (!found) {
      // fetch
      this.props.getUser(this.props.params.id);
    }
  }
  renderUser () {
    return <UserForm save={this.props.saveUser} delete={this.props.deleteUser} onChange={this.props.updateUserForm} user={this.props.userOverview.user} />;
  }

  renderLoader () {
    return <Loader type="line-scale" />;
  }


  renderDeleteMessage () {
    return (
      <div>
        <p>Der Benutzer wurde <strong>gelöscht</strong>!</p>
        <Link to="/admin/users">Zurück zur Benutzerübersicht</Link>
      </div>
    );
  }

  render () {
    let content;
    if (this.props.userOverview.user == null) {
      content = this.renderLoader();
    } else if (this.props.userOverview.user.isDeleted === true) {
      content = this.renderDeleteMessage();
    } else {
      content = this.renderUser();
    }

    return (
      <div>
          <h3><small>Benutzer</small></h3>
          {content}
      </div>
    );
  }
}


export default connect(state => ({
  userOverview: state.userOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(User);