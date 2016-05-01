import React from 'react';

import Icon from '../Icon';

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

  render() {
    const classes = "status-bar " + this.state.status.level;
    return (
      <div className={classes}>
        <span className="status-language-information">{this.state.status.languageInformation}</span>
        <span className="status-message">{this.state.status.message}</span>
      </div>
    );
  }
}
