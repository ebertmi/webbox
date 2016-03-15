import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {EmbedTableRow} from '../../components/admin/EmbedTableRow';
import * as AdminActions from '../../actions/AdminActions';

class UserOverview extends Component {
  componentDidMount() {
    // fetch embeds from server
    this.props.requestEmbeds(this.props.embedOverview.embedsQuery.page, this.props.embedOverview.embedsQuery.limit);
  }


  render () {
    return (
      <div>
        <h2>Codebeispiele</h2>
        <table className="table table-sm tabl-striped">
          <thead className="thead-inverse">
            <tr>
              <th>Id</th>
              <th>Titel</th>
              <th>Sprache</th>
              <th>Autor</th>
              <th>Erstellt am</th>
              <th>Zuletzt verändert am</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {this.props.embedOverview.embeds.map((course, index) => {
              return <EmbedTableRow key={index} data={course}/>;
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default connect(state => ({
  embedOverview: state.embedOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(UserOverview);