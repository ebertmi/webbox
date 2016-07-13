import React from 'react';
import LazyLoad from 'react-lazyload';

/**
 */
export default class IFrame extends React.Component {
  constructor(props) {
    super(props);
    this.iframe = null;
  }

  componentWillMount() {

  }

  componentDidMount() {
  }

  initIFrame() {
    if (this.iframe) {
      const height = Math.max( this.iframe.contentWindow.document.body.scrollHeight,  this.iframe.contentWindow.document.body.offsetHeight,  this.iframe.contentWindow.document.documentElement.clientHeight,  this.iframe.contentWindow.document.documentElement.scrollHeight,  this.iframe.contentWindow.document.documentElement.offsetHeight);
      this.iframe.style.height = height + 'px';
    }
  }

  onRef(ref) {
    this.iframe = ref;
  }

  renderIFrame() {
    return <iframe className={this.props.className} ref={this.onRef.bind(this)} onLoad={this.initIFrame.bind(this)} width={this.props.width} height={this.props.height} src={this.props.src} seamless={true} allowFullScreen={true} frameBorder="0" />;
  }

  render() {
    if (this.props.lazy) {
      return (
        <LazyLoad height={this.props.height} once>
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
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  resizable: React.PropTypes.bool,
  frameBorder: React.PropTypes.string,
  lazy: React.PropTypes.bool
};

IFrame.defaultProps = {
  width: 900,
  height: 500,
  resizable: true,
  frameBorder: "0",
  lazy: false
};
