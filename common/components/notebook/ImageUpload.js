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
export default class ImageUpload extends React.Component {
  constructor(props) {
    super(props);

    this.onDrop = this.onDrop.bind(this);
    this.onProgress = this.onProgress.bind(this);
    this.onDone = this.onDone.bind(this);
    this.onError = this.onError.bind(this);
    this.onImageClick = this.onImageClick.bind(this);
  }

  componentWillMount() {
    this.setState({
      isUploading: false,
      progress: 0,
      images: []
    });
  }

  componentDidMount() {

  }

  onDrop(files) {
    let course = this.props.course || 'no-course';
    let uploader = new API.media.ImageUploader(files, course, this.onError, this.onProgress, this.onDone);
    this.setState({
      isUploading: true
    });
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
    const dropzoneText = this.state.isUploading ? `Lade hoch ... (${this.state.progress}%)` : 'Lege hier Bilder ab, um sie hochzuladen.';
    return (
      <div>
        <div className="card-deck">
          <div className="card card-block card-inverse card-primary text-xs-center" style={{ maxWidth: MAX_WIDTH }}>
            <Dropzone accept="image/*" multiple={false} onDrop={this.onDrop} className="image-dropzone">
                <blockquote className="card-blockquote">
                  <p>{dropzoneText}</p>
                  <p>Klicke auf ein Bild, um es einzufügen.</p>
                  <footer>
                    <small>
                      Maximal 5MB
                    </small>
                  </footer>
                </blockquote>
            </Dropzone>
          </div>
          { images.map(img => {
            return <ImagePreview width={MAX_WIDTH} key={img.path} src={img.path} filename={img.filename} onClick={this.onImageClick} />;
          })}
        </div>
      </div>
    );
  }
}

ImageUpload.propTypes = {

};

ImageUpload.defaultProps = {
};