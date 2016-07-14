import React from 'react';

import { toBootstrapClass } from '../../models/severity';

/**
 * The StatusBar displays information in the bottom of the screen:
 *  - Language and Project information
 *  - Username
 *  - Status messages
 */
export default class StatusBar extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
  }

  componentWillMount() {
    this.props.project.status.on('change', this.onChange);
    this.onChange();
  }

  componentWillUnmount() {
    this.props.project.status.removeListener('change', this.onChange);
  }

  onChange() {
    this.setState({
      status: this.props.project.status.getStatusData()
    });
  }

  renderUsername() {
    if (this.state.status.username === 'anonymous') {
      let url = window.location.href;
      let loginUrl = `/login?next=${encodeURI(url)}`;
      return (<span className="status-username pull-right"><span className="prefix">NICHT ANGEMELDET: </span><a href={loginUrl} title="Anmelden und zur Seite zurück">Anmelden</a></span>);
    } else {
      return (<span className="status-username pull-right"><span className="prefix">angemeldet als </span>{this.state.status.username} {' '} <small>(<a href="/logout" title="Abmelden">Abmelden</a>)</small></span>);
    }
  }

  render() {
    const classes = "status-bar " + toBootstrapClass(this.state.status.severity);
    return (
      <div className={classes}>
        <span className="status-language-information">{this.state.status.languageInformation}</span>
        {this.renderUsername()}
        <span className="status-message">{this.state.status.message}</span>
        <span className="status-navigation pull-xs-right"><a href="/" title="Startseite">Startseite</a></span>
      </div>
    );
  }
}
