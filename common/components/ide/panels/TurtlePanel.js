import React from 'react';

export default class TurtlePanel extends React.Component {
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
      <h1>Turtle-Ausgabe</h1>
    );
  }
}
