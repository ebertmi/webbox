/**
 * Copyright (c) 2017 maslianok (https://github.com/maslianok/react-resize-detector)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

export const parentStyle = {
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  overflow: 'scroll',
  zIndex: -1,
  visibility: 'hidden',
};

export const shrinkChildStyle = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '200%',
  height: '200%',
};

export const expandChildStyle = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

export default class ResizeDetector extends Component {
  constructor() {
    super();

    this.state = {
      expandChildHeight: 0,
      expandChildWidth: 0,
      expandScrollLeft: 0,
      expandScrollTop: 0,
      shrinkScrollTop: 0,
      shrinkScrollLeft: 0,
      lastWidth: 0,
      lastHeight: 0,
    };

    this.reset = this.reset.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentWillMount() {
    this.forceUpdate();
  }

  componentDidMount() {
    const [width, height] = this.containerSize();
    this.reset(width, height);
  }

  shouldComponentUpdate(nextProps) {
    return this.props !== nextProps;
  }

  componentDidUpdate() {
    this.expand.scrollLeft = this.expand.scrollWidth;
    this.expand.scrollTop = this.expand.scrollHeight;

    this.shrink.scrollLeft = this.shrink.scrollWidth;
    this.shrink.scrollTop = this.shrink.scrollHeight;
  }

  containerSize() {
    return [
      this.props.handleWidth && this.container.parentElement.offsetWidth,
      this.props.handleHeight && this.container.parentElement.offsetHeight,
    ];
  }

  reset(containerWidth, containerHeight) {
    if (typeof window === 'undefined') {
      return;
    }

    const parent = this.container.parentElement;

    let position = 'static';
    if (parent.currentStyle) {
      position = parent.currentStyle.position;
    } else if (window.getComputedStyle) {
      position = window.getComputedStyle(parent).position;
    }
    if (position === 'static') {
      parent.style.position = 'relative';
    }

    this.setState({
      expandChildHeight: this.expand.offsetHeight + 10,
      expandChildWidth: this.expand.offsetWidth + 10,
      lastWidth: containerWidth,
      lastHeight: containerHeight,
    });
  }

  handleScroll() {
    if (typeof window === 'undefined') {
      return;
    }

    const { state } = this;

    const [width, height] = this.containerSize();
    if ((width !== state.lastWidth) || (height !== state.lastHeight)) {
      this.props.onResize(width, height);
    }

    this.reset(width, height);
  }

  render() {
    const { state } = this;

    const expandStyle = Object.assign({}, expandChildStyle, {
      width: state.expandChildWidth,
      height: state.expandChildHeight,
    });

    return (
      <div style={parentStyle} ref={(e) => { this.container = e; }}>
        <div style={parentStyle} onScroll={this.handleScroll} ref={(e) => { this.expand = e; }}>
          <div style={expandStyle} />
        </div>
        <div style={parentStyle} onScroll={this.handleScroll} ref={(e) => { this.shrink = e; }}>
          <div style={shrinkChildStyle} />
        </div>
      </div>
    );
  }
}

ResizeDetector.propTypes = {
  handleWidth: PropTypes.bool,
  handleHeight: PropTypes.bool,
  onResize: PropTypes.func,
};

ResizeDetector.defaultProps = {
  handleWidth: false,
  handleHeight: false,
  onResize: e => e,
};