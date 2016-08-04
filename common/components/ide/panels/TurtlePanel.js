import React from 'react';

export default class TurtlePanel extends React.Component {
  constructor(props) {
    super(props);

    this.onRef = this.onRef.bind(this);
  }

  componentWillUnmount() {
    if (this.turtleContainer) {
      while (this.turtleContainer.firstChild) {
        this.turtleContainer.removeChild(this.turtleContainer.firstChild);
      }
    }
  }

  onRef(ref) {
    if (ref) {
      this.turtleContainer = ref;
      ref.appendChild(this.props.item.canvas);
    }
  }

  render() {
    return (
      <div className="turtle-panel">
        <h1>Turtle-Ausgabe</h1>
        <div ref={this.onRef}></div>
      </div>
    );
  }
}
