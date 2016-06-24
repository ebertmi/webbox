import React from 'react';

import { Time } from '../../Time';

export default class ErrorView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };

  }

  componentWillMount() {
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <div className="row">
      <div className="col-xs-12">
        <h4>Einreichungen</h4>
      </div>
      <div className="col-xs-12">
        <table className="table table-sm table-hover">
          <thead>
            <tr>
              <th>#</th>
              <th>Benutzer</th>
              <th>Hinweis</th>
              <th>Zeitpunkt</th>
            </tr>
          </thead>
          <tbody>
            {this.props.submissions.map((submission) => {

              return (
                <tr key={submission.id}>
                  <td><a href="" target="_blank">Anschauen</a></td>
                  <td>{submission.username}</td>
                  <td><code>{submission.message}</code></td>
                  <td><Time value={new Date(submission.timeStamp)} locale="de" relative={true} invalidDateString="Nicht verfügbar"></Time></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    );
  }
}

ErrorView.propTypes = {
  errors: React.PropTypes.array,
  n: React.PropTypes.number
};

ErrorView.defaultProps = {
  errors: []
};