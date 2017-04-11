import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders a image preview for the given image src. Clicking the image allows to make an operation.
 */
export default class ImagePreview extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onImageClick = this.onImageClick.bind(this);
    this.onEnlarge = this.onEnlarge.bind(this);
  }

  onImageClick(e) {
    if (e) {
      e.preventDefault();
    }

    this.props.onClick.call(null, this.props.src);
  }

  onEnlarge(e) {
    if (e) {
      e.preventDefault();
    }

    window.open(this.props.src, '_blank');
  }

  renderOld() {
    return (
      <div className="card" style={{ maxWidth: this.props.width + 2 }}>
        <img className="card-img-top" data-path={this.props.src} src={this.props.src} title={"Einfügen - " + this.props.filename} width={this.props.width} height={this.props.height} onClick={this.onImageClick}/>
        <div className="card-block">
          {/*<small className="text-muted"><a className="image-preview-link" title="In neuem Tab öffnen" target="_blank" href={this.props.src}>{this.props.src}</a></small>*/}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="image-preview">
        <img width="220" height="220" className="thumbnail" src={this.props.src} title={"Einfügen - " + this.props.filename} onClick={this.onImageClick}/>
        <div className="gallery-poster">
          <span className="fa fa-search" title="Bild vergrößern" onClick={this.onEnlarge} />
        </div>
      </div>
    );
  }
}

ImagePreview.propTypes = {
  filename: PropTypes.string.isRequired,
  src: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  height: PropTypes.number,
  width: PropTypes.number
};

ImagePreview.defaultProps = {
  onClick: () => {},
  height: 150,
  width: 150
};
