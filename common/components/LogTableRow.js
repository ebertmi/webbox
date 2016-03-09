import React, {Component} from 'react';

class LogTableRow extends Component {
  render () {
    return (
      <tr>
        <td>Event</td>
        <td>Message</td>
        <td>Type</td>
        <td>Data</td>
        <td>Zeitpunkt</td>
        <td>ID</td>
      </tr>
    );
  };
}