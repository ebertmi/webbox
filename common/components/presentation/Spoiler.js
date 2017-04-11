import React from "react";
import PropTypes from 'prop-types';
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
  children: PropTypes.node,
  style: PropTypes.object
};

Spoiler.contextTypes = {
  styles: PropTypes.object
};

export default Radium(Spoiler);