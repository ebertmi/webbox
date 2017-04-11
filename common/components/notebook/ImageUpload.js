import React from 'react';
import PropTypes from 'prop-types';

import Dropzone from 'react-dropzone';

import { Severity } from '../../models/severity';
import ImagePreview from './ImagePreview';
import { API } from '../../services';

const MAX_WIDTH = 200;

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class ImageUpload extends React.PureComponent {
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
    //let course = this.props.course != null && this.props.course != '' ? this.props.course : 'no-course';
    let document = this.props.document != null && this.props.document != '' ? this.props.document : 'base';
    new API.media.ImageUploader(files, document, this.onError, this.onProgress, this.onDone);
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
    this.context.messageList.showMessage(Severity.Error, message);
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
      <div className="image-upload-wrapper" data-name="image-upload">
          <div data-name="image-upload" className="image-upload card-primary text-xs-center" style={{ maxWidth: MAX_WIDTH }}>
            <Dropzone accept="image/*" multiple={false} onDrop={this.onDrop} className="image-dropzone" data-name="image-upload">
                <div data-name="image-upload">
                  <p data-name="image-upload" style={{textAlign: 'left'}}>{dropzoneText}</p>
                  <p data-name="image-upload" style={{textAlign: 'left'}}>Klicke auf ein Bild, um es einzufügen.<br /><small data-name="image-upload">Maximal 5MB</small></p>
                </div>
            </Dropzone>
          </div>
          { images.map(img => {
            return <ImagePreview width={MAX_WIDTH} key={img.path} src={img.path} filename={img.filename} onClick={this.onImageClick} />;
          })}
      </div>
    );
  }
}

ImageUpload.propTypes = {

};

ImageUpload.defaultProps = {
};

ImageUpload.contextTypes = {
  messageList: PropTypes.object
};