import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { PaginationContainer } from '../PaginationContainer';
import { LoadingContainer } from '../LoadingContainer';
import {EmbedTableRow} from '../../components/admin/EmbedTableRow';
import * as AdminActions from '../../actions/AdminActions';

class UserOverview extends Component {

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
          <th>URL</th>
        </tr>
      </thead>
      <tbody>
        {this.props.embedOverview.embeds.map((course, index) => {
          return <EmbedTableRow key={index} data={course}/>;
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
        <h2>Codebeispiele</h2>
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
)(UserOverview);