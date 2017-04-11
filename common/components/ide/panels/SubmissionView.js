import React from 'react';
import PropTypes from 'prop-types';
import { Time } from '../../Time';

export default class SubmissionView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      submissions: []
    };

    this.onChange = this.onChange.bind(this);
    this.onToggleSubmissions = this.onToggleSubmissions.bind(this);
  }

  componentWillMount() {
    this.props.submissions.on('change', this.onChange);
    this.props.submissions.subscribe(); // ToDo: put this into the submission view
    this.onChange(); // Trigger initial state update
  }

  componentWillUnmount() {
    this.props.submissions.removeListener('change', this.onChange);
  }

  onToggleSubmissions(e) {
    e.preventDefault();

    if (this.props.submissions) {
      this.props.submissions.toggle();
    }
  }

  onChange() {
    this.setState({
      submissions: this.props.submissions.get(),
      isActive: this.props.submissions.isActive()
    });
  }

  render() {
    //const iconName = this.state.isActive ? 'toggle-on' : 'toggle-off';
    const toggleText = this.state.isActive ? 'Deaktivieren' : 'Aktivieren';
    return (
      <div className="row">
      <div className="col-xs-12">
        <h4>Einreichungen</h4>
        <button className="btn btn-sm btn-primary m-b-1" title="Aktivieren/Deaktivieren" onClick={this.onToggleSubmissions}>{toggleText}</button>
        {/*<span>Akzeptiert?</span> <Icon className="icon-control" name={iconName} title="Aktivieren/Deaktivieren" onClick={this.onToggleSubmissions} />*/}
      </div>
      <div className="col-xs-12">
        <table className="table table-sm table-hover">
          <thead>
            <tr>
              <th>#</th>
              <th>Benutzer</th>
              <th>Hinweis</th>
              <th>Zeitpunkt</th>
              <th>Revision</th>
            </tr>
          </thead>
          <tbody>
            {this.state.submissions.map((submission) => {

              return (
                <tr key={submission.id}>
                  <td><a href={submission.shareableLink} target="_blank">Anschauen</a></td>
                  <td>{submission.username}</td>
                  <td><code>{submission.message}</code></td>
                  <td><Time value={new Date(submission.timeStamp)} locale="de" relative={true} invalidDateString="Nicht verfügbar"></Time></td>
                  <td><span className="tag tag-default">{submission.revision}</span></td>
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

SubmissionView.propTypes = {
  submissions: PropTypes.object.isRequired
};
