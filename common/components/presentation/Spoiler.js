import React from "react";
import { getStyles } from "spectacle/lib/utils/base";
import Radium from "radium";

export class Spoiler extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (<details style={[this.context.styles.components.orderedList, getStyles.call(this), this.props.style]}>
      <summary>{this.props.summary}</summary>
      {this.props.children}
    </details>);
  }
}

Spoiler.propTypes = {
  children: React.PropTypes.node,
  style: React.PropTypes.object
};

Spoiler.contextTypes = {
  styles: React.PropTypes.object
};

export default Radium(Spoiler);