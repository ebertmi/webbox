import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { getStyles } from 'spectacle/lib/utils/base';
import styled from 'react-emotion';

const StyledDefaultWrapper = styled.div(props => props.styles);

class DefaultWrapper extends Component {
  render() {
    const styles = [
      this.context.styles.components.markdown,
      getStyles.call(this),
      this.context.typeface || {},
      this.props.style
    ];

    return (
      <StyledDefaultWrapper className={this.props.className} styles={styles}>
        {this.props.children}
      </StyledDefaultWrapper>
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

export default DefaultWrapper;