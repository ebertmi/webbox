import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import LazyLoad from 'react-lazyload';

/**
 */
export default class IFrame extends React.Component {
  constructor(props) {
    super(props);
    this.iframe = null;
    this.onRef = this.onRef.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.initIFrame = this.initIFrame.bind(this);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  initIFrame() {
    return;

    // dynamic resizing disabled for now, seems to work without
    /*
    if (this.iframe) {
      const height = Math.max( this.iframe.contentWindow.document.body.scrollHeight,  this.iframe.contentWindow.document.body.offsetHeight,  this.iframe.contentWindow.document.documentElement.clientHeight,  this.iframe.contentWindow.document.documentElement.scrollHeight,  this.iframe.contentWindow.document.documentElement.offsetHeight);
      this.iframe.style.height = height + 'px';
    }
    */
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
  src: React.PropTypes.string.isRequired,
  width: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
  height: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
  resizable: React.PropTypes.bool,
  frameBorder: React.PropTypes.string,
  lazy: React.PropTypes.bool,
  noFocus: React.PropTypes.bool
};

IFrame.defaultProps = {
  width: 900,
  height: 500,
  resizable: true,
  frameBorder: "0",
  lazy: false,
  noFocus: false
};
