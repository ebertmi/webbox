import React, { Component, PropTypes } from "react";
import { getStyles } from "spectacle/lib/utils/base";
import Radium from "radium";

class OrderedList extends Component {
  render() {
    return (
      <ol {...this.props} className={this.props.className} style={[this.context.styles.components.orderedList, getStyles.call(this), this.props.style]}>
        {this.props.children}
      </ol>
    );
  }
}

OrderedList.propTypes = {
  children: PropTypes.node,
  style: PropTypes.object,
  className: PropTypes.string
};

OrderedList.contextTypes = {
  styles: PropTypes.object
};

export default Radium(OrderedList);