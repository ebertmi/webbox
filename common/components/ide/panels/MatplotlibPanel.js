import React from 'react';

export default class MatplotlibPanel extends React.Component {
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
        <div ref={this.onRef.bind(this)}></div>
      </div>
    );
  }
}
