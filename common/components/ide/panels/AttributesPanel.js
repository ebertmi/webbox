import React from 'react';

import {Button, Input} from '../../bootstrap';

export default class AttributePanel extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
  }

  componentWillUnmount() {
  }

  onChangeOption() {
    this.setState({
      stats: {}
    });
  }

  render() {
    return (
      <form className="options-panel" onSubmit={e => e.preventDefault()}>
        <legend>Allgemeine Eigenschaften</legend>
        <hr/>
      </form>
    );
  }
}
