import React, { Component, PropTypes } from "react";
import { getStyles } from "spectacle/lib/utils/base";
import Radium from "radium";

class DefaultWrapper extends Component {
  render() {
    return (
      <div className={this.props.className} style={[this.context.styles.components.markdown, getStyles.call(this), this.props.style]}>
        {this.props.children}
      </div>
    );
  }
}

DefaultWrapper.propTypes = {
  children: PropTypes.node,
  style: PropTypes.object,
  className: PropTypes.string
};

DefaultWrapper.contextTypes = {
  styles: PropTypes.object
};

export default Radium(DefaultWrapper);