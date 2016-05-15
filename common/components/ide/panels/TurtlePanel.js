import React from 'react';

export default class TurtlePanel extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
  }

  componentWillUnmount() {
  }

  onRef(ref) {
    if (ref) {
      ref.appendChild(this.props.item);
    }
  }

  render() {
    return (
      <div>
        <h1>Turtle-Ausgabe</h1>
        <div ref={this.onRef.bind(this)}></div>
      </div>
    );
  }
}
