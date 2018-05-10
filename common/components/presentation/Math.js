import React from 'react';
import katex from 'katex';
import PropTypes from 'prop-types';

export class Math extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      html: this.generateHtml(this.props)
    };
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillUpdate(nextProps, nextState) {
    nextState.html = this.generateHtml(nextProps);
  }

  generateHtml(props) {
    let rendered;
    try {
      rendered = katex.renderToString(props.math || props.children, {
        displayMode: this.props.displayMode,
        throwOnError: false
      });
    } catch (e) {
      rendered = '<span>' + e.message + '</span>';
    }

    return rendered;
  }

  render() {
    const markup = {__html: this.state.html};
    if (this.props.displayMode === false) {
      return <span style={this.props.style} dangerouslySetInnerHTML={markup}></span>;
    } else {
      return <div style={this.props.style} dangerouslySetInnerHTML={markup}></div>;
    }
  }
}

Math.propTypes = {
  children: PropTypes.string,
  displayMode: PropTypes.bool
};

Math.defaultProps = {
  math: false,
  displayMode: false
};

export default Math;