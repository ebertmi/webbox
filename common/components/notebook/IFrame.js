import React from 'react';
import PropTypes from 'prop-types';
import LazyLoad from 'react-lazyload';

/**
 */
export default class IFrame extends React.PureComponent {
  constructor(props) {
    super(props);
    this.iframe = null;
    this.onRef = this.onRef.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.initIFrame = this.initIFrame.bind(this);
  }

  onRef(ref) {
    this.iframe = ref;
  }

  onFocus() {
    if (this.props.noFocus) {
      if (this.iframe && this.iframe.parent) {
        this.iframe.parent.focus();
      }
    }
  }

  initIFrame() {
    // dynamic resizing disabled for now, seems to work without
    /*
    if (this.iframe) {
      const height = Math.max( this.iframe.contentWindow.document.body.scrollHeight,  this.iframe.contentWindow.document.body.offsetHeight,  this.iframe.contentWindow.document.documentElement.clientHeight,  this.iframe.contentWindow.document.documentElement.scrollHeight,  this.iframe.contentWindow.document.documentElement.offsetHeight);
      this.iframe.style.height = height + 'px';
    }
    */
  }

  renderIFrame() {
    return <iframe className={this.props.className} onFocus={this.onFocus} ref={this.onRef} onLoad={this.initIFrame} width={this.props.width} height={this.props.height} src={this.props.src} seamless={true} allowFullScreen={true} frameBorder="0" />;
  }

  render() {
    let height = this.props.height;

    height = parseInt(height);
    if (isNaN(height)) {
      height = IFrame.defaultProps.height;
    }

    if (this.props.lazy) {
      return (
        <LazyLoad height={height} once>
          {this.renderIFrame()}
        </LazyLoad>
      );
    }

    // only iFrame
    return this.renderIFrame();
  }
}

IFrame.propTypes = {
  src: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  resizable: PropTypes.bool,
  frameBorder: PropTypes.string,
  lazy: PropTypes.bool,
  noFocus: PropTypes.bool
};

IFrame.defaultProps = {
  width: 900,
  height: 500,
  resizable: true,
  frameBorder: '0',
  lazy: false,
  noFocus: false
};
