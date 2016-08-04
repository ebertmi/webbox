import React from 'react';

import Tab from './Tab';

/**
 * Represents a Tab for Turtle Panels with a Title. If the item
 * provides the Eventemitter Interface, then we listen to title changes.
 *
 * This uses https://thenounproject.com/term/turtle/5353/ for the turtle Icon By Samuel Fine, US.
 * See https://creativecommons.org/licenses/by/3.0/us/
 *
 * @export
 * @class TurtleTab
 * @extends {React.Component}
 */
export default class TurtleTab extends React.Component {

  constructor(props) {
    super(props);

    this.onTitle = this.onTitle.bind(this);
    this.state = {
      title: 'Turtle-Ausgabe'
    };
  }

  componentDidMount() {
    if (this.props.item.on) {
      this.props.item.on('title', this.onTitle);
    }
  }

  componentWillUnmount() {
    if (this.props.item.removeListener) {
      this.props.item.removeListener('title', this.onTitle);
    }
  }

  onTitle(title) {
    this.setState({ title });
  }

  // ToDo add Eventemiiter
  render() {
    return <Tab {...this.props} icon="turtle.svg" useImage={true}>{this.state.title}</Tab>;
  }
}
