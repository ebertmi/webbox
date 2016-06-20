import React from 'react';

import {Button, Input} from '../../bootstrap';

export default class InsightsPanel extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
  }

  onChange() {
    // Rerender
  }

  componentWillMount() {
    this.props.item.getEvents();

    this.props.item.on('change', this.onChange);
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <div className="options-panel" onSubmit={e => e.preventDefault()}>
        <h3>Interaktionen</h3>
        <hr/>

        <h3>Daten</h3>
      </div>
    );
  }
}
