import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as AdminActions from '../../actions/AdminActions';

class LogOverview extends Component {
  render () {
    console.log(this.props);
    return (
      <div>
        <h2>Letzte Änderungen</h2>
        <table className="table table-sm tabl-striped">
          <thead className="thead-inverse">
            <tr>
              <th>Event</th>
              <th>Message</th>
              <th>Type</th>
              <th>Data</th>
              <th>Zeitpunkt</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {this.props.logs.map((log, index) => {
              return <LogTableRow key={index} data={log} />;
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default connect(state => ({
  logs: state.dashboardApp.logs
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(LogOverview);