import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';


/**
 * Renders a image preview for the given image src. Clicking the image allows to make an operation.
 */
export default class ImagePreview extends React.Component {
  constructor(props) {
    super(props);

    this.onImageClick = this.onImageClick.bind(this);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  onImageClick(e) {
    const src = e.target.getAttribute('data-path') || '';
    this.props.onClick.call(null, src);
  }

  render() {
    return (
      <div className="card" style={{ maxWidth: this.props.width + 2 }}>
        <img className="card-img-top" data-path={this.props.src} src={this.props.src} title={"Einfügen - " + this.props.filename} width={this.props.width} height={this.props.height} onClick={this.onImageClick}/>
        <div className="card-block">
          <small className="text-muted"><a className="image-preview-link" title="In neuem Tab öffnen" target="_blank" href={this.props.src}>{this.props.src}</a></small>
        </div>
      </div>
    );
  }
}

ImagePreview.propTypes = {
  filename: React.PropTypes.string.isRequired,
  src: React.PropTypes.string.isRequired,
  onClick: React.PropTypes.func,
  height: React.PropTypes.number,
  width: React.PropTypes.number
};

ImagePreview.defaultProps = {
  onClick: () => {},
  /*height: 150,*/
  width: 200
};
