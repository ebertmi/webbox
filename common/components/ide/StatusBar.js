import React from 'react';
import classnames from 'classnames';
import capitalize from 'lodash/capitalize';
import trimEnd from 'lodash/trimEnd';

import { toBootstrapClass } from '../../models/severity';
import { ImageIcon } from '../Icon';

/**
 * Try to detect, if we are in an iFrame
 *
 * @returns true if loaded inside an iframe, otherwise false
 */
function loadedInIFrame () {
  return window.frameElement && window.frameElement.nodeName == "IFRAME";
}

function languageToIcon(language) {
  let languageWithoutNumbers = language.replace(/\d+/, '');
  languageWithoutNumbers = trimEnd(languageWithoutNumbers);
  languageWithoutNumbers = languageWithoutNumbers.toLowerCase();

  switch (languageWithoutNumbers) {
    case 'python':
      return 'file_type_python@2x.png';
    case 'c':
      return 'file_type_c@2x.png';
    case 'c++':
      return 'file_type_c++@2x.png';
    case '':
      return 'file_type_java@2x';
    default:
      return undefined;
  }
}

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
    this.isInIFrame = loadedInIFrame();
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
      status: this.props.project.status.getStatusData(),
      originalLink: this.props.project.getOriginalLink()
    });
  }

  renderUsername() {
    if (this.state.status.username === 'anonymous') {
      let url = window.location.href;
      let loginUrl = `/login?next=${encodeURI(url)}`;
      return (<span className="status-username pull-right"><span className="prefix">NICHT ANGEMELDET: </span><a href={loginUrl} title="Anmelden und zur Seite zurück">Anmelden</a></span>);
    } else {
      return (<span className="status-username pull-right"><span className="prefix hidden-xs-down">angemeldet als </span>{this.state.status.username} {' '} <small>(<a href="/logout" title="Abmelden">Abmelden</a>)</small></span>);
    }
  }

  render() {
    const classes = classnames('status-bar', toBootstrapClass(this.state.status.severity), 'hidden-print');
    const linkToStart = this.isInIFrame ? null :  <span className="status-navigation"><a className="tag tag-info" href="/" target="_blank" title="Startseite">Startseite</a></span>;

    let languageEmbedType = `(${capitalize(this.state.status.embedType)})`;
    let languageInformation = `${this.state.status.languageDisplayName} ${languageEmbedType}`;
    let languageIconImage = languageToIcon(this.state.status.languageDisplayName);
    let languageDisplay = languageIconImage !== undefined ? <span><ImageIcon icon={languageIconImage} title={languageInformation} /> {languageEmbedType}</span> : <span className="tag tag-success">{languageInformation} {languageEmbedType}</span>;

    return (
      <div className={classes}>
        <span className="status-language-information">{ languageDisplay }</span>
        {this.renderUsername()}
        <span className="status-message">{this.state.status.message}</span>
        <span className="status-navigation first-child"><a className="tag tag-primary" href={this.state.originalLink} target="_blank" title="Original Anzeigen">Zum Original</a></span>
        {linkToStart}
      </div>
    );
  }
}
