import React, {Component} from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as AdminActions from '../../actions/AdminActions';

class MailOverview extends Component {
  constructor(props) {
    super(props);

    this.onSubmit = this.onSubmit.bind(this);
    this.handleSendConfirm = this.handleSendConfirm.bind(this);
    this.handleSendDismiss = this.handleSendDismiss.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      showMailConfirm: false,
    };
  }

  onSubmit(event) {
    if (this.props.mailOverview.mail.email === '' || this.props.mailOverview.mail.subject === '' || this.props.mailOverview.mail.message === '') {
      // ToDo: we should add a good message here!

      event.preventDefault();
      return;
    }

    this.setState({ showMailConfirm: true });
    event.preventDefault();
  }

  renderButton() {
    if (this.state.showMailConfirm) {
      return this.renderConfirmSend();
    } else {
      return <div className="form-footer"><button type="submit" className="btn btn-primary">Abschicken</button></div>;
    }
  }

  handleSendConfirm(event) {
    // now do teh action
    let mailData = this.props.mailOverview.mail;
    this.props.sendMail(mailData.email, mailData.subject, mailData.message);

    this.setState({ showMailConfirm: false });
    event.preventDefault();
  }

  handleSendDismiss(event) {
    this.setState({ showMailConfirm: false });
    event.preventDefault();
  }

  handleChange(event) {
    let value;
    let newMailData = this.props.mailOverview.mail;
    let name = event.target.name;

    switch (event.target.type) {
      case 'checkbox':
        value = event.target.checked;
        break;
      default:
        value = event.target.value;
    }

    newMailData[name] = value;

    this.props.changeMailData(newMailData);
  }

  /**
   * Renders the confirm dialog when a user should be deleted
   */
  renderConfirmSend () {
    return (
      <div className="form-footer">
        <ReactCSSTransitionGroup transitionName="fade-in" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
          <div className="form-inline">
            <p className="form-control-static">Wirklich abschicken?</p>
            <button onClick={this.handleSendConfirm} className="btn btn-danger">Ja</button>
            <button onClick={this.handleSendDismiss} className="btn btn-default">Nein</button>
          </div>
        </ReactCSSTransitionGroup>
      </div>
    );
  }

  render () {
    return (
        <div className="p-b-1">
          <h2>Mail-Service <small>Offizielle E-Mails verschicken</small></h2>
          <form onSubmit={this.onSubmit}>
            <div className="form-group">
              <label htmlFor="email">Empfänger</label>
              <input onChange={this.handleChange} value={this.props.mailOverview.mail.email} type="email" name="email" className="form-control" id="email" aria-describedby="emailHelp" placeholder="E-Mail-Adresse" />
              <small id="emailHelp" className="form-text text-muted">Der Empfänger (E-Mail-Adresse)</small>
            </div>
            <div className="form-group">
              <label htmlFor="subject">Betreff</label>
              <input onChange={this.handleChange} value={this.props.mailOverview.mail.subject} name="subject" type="text" className="form-control" id="subject" aria-describedby="subjectHelp" placeholder="Betreff..." />
              <small id="subjectHelp" className="form-text text-muted">Betreffzeile in der Mail.</small>
            </div>
            <div className="form-group">
              <label htmlFor="message">Nachricht</label>
              <textarea onChange={this.handleChange} value={this.props.mailOverview.mail.message} name="message" className="form-control" id="message" rows="5"></textarea>
            </div>
            { this.renderButton() }
          </form>
        </div>
    );
  }
}

export default connect(state => ({
  mailOverview: state.mailOverview
}),
  dispatch => bindActionCreators(AdminActions, dispatch)
)(MailOverview);