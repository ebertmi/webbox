import React from 'react';

export default class MatplotlibPanel extends React.Component {
  constructor(props) {
    super(props);

    this.imageRef = null;
  }

  onComponentWillUnmount() {
    if (this.imageRef) {
      let last;
      while (last = this.imageRef.lastChild) {
        this.imageRef.removeChild(last);
      }
    }
  }

  onRef(ref) {
    if (ref) {
      this.imageRef = ref;
      ref.appendChild(this.props.item);
    }
  }

  render() {
    return (
      <div className="math-panel">
        <div ref={this.onRef.bind(this)}></div>
      </div>
    );
  }
}
