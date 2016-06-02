import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import Immutable from 'immutable';

import Dropzone from 'react-dropzone';

import ImagePreview from './ImagePreview';
import { API } from '../../services';

const MAX_WIDTH = 200;

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class ImageGallery extends React.Component {
  constructor(props) {
    super(props);

    this.onProgress = this.onProgress.bind(this);
    this.onDone = this.onDone.bind(this);
    this.onError = this.onError.bind(this);
    this.onImageClick = this.onImageClick.bind(this);
  }

  componentWillMount() {
    this.setState({
      isFetching: false,
      images: []
    });
  }

  componentDidMount() {

  }


  onProgress(progess) {
    if (progess) {
      this.setState({
        progess: progess
      });
    }
  }

  onDone(event, result) {
    if (result.success === true) {
      const newImage = {
        path: `${result.path}`,
        filename: result.filename,
        originalFilename: result.originalFilename,
        type: result.headers['content-type']
      };

      const newImages = this.state.images.slice();
      newImages.push(newImage);

      this.setState({
        isUploading: false,
        images: newImages
      });
    } else {
      this.setState({
        isUploading: false,
        isError: true
      });
    }
  }

  onError(message) {
    console.log(message);
  }

  onImageClick(src) {
    if (this.props.onInsertImage) {
      this.props.onInsertImage.call(null, src);
    }
  }

  render() {
    const images = this.state.images || [];
    return (
      <div>
        <div className="card-deck">
          { images.map(img => {
            return <ImagePreview width={MAX_WIDTH} key={img.path} src={img.path} filename={img.filename} onClick={this.onImageClick} />;
          })}
        </div>
      </div>
    );
  }
}

ImageGallery.propTypes = {

};

ImageGallery.defaultProps = {
};
