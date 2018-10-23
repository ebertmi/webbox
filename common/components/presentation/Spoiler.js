import React from 'react';
import PropTypes from 'prop-types';
import { getStyles } from 'spectacle/lib/utils/base';
import styled from 'react-emotion';

const StyledSpoiler = styled('details', props => props.styles);

export class Spoiler extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const styles = [
      this.context.styles.components.orderedList,
      getStyles.call(this),
      this.context.typeface || {},
      this.props.style
    ];

    return (<StyledSpoiler styles={styles}>
      <summary>{this.props.summary}</summary>
      {this.props.children}
    </StyledSpoiler>);
  }
}

Spoiler.propTypes = {
  children: PropTypes.node,
  style: PropTypes.object
};

Spoiler.contextTypes = {
  styles: PropTypes.object
};

export default Spoiler;