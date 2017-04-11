import React from 'react';
import PropTypes from 'prop-types';

import { Severity } from '../../models/severity';
import ImagePreview from './ImagePreview';
import ImageUpload from './ImageUpload';
import { API } from '../../services';

const MAX_WIDTH = 200;

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class ImageGallery extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onImageClick = this.onImageClick.bind(this);
  }

  componentWillMount() {
    this.setState({
      isFetching: false
    });
  }

  componentDidMount() {
    function getFilenameFromPath(path) {
      let lastSlashPos = path.lastIndexOf('/');
      lastSlashPos = lastSlashPos === -1 ? 0 : lastSlashPos; // may contain no slashes at all
      return path.substring(lastSlashPos);
    }

    function addLeadingSlash(path) {
      if (path[0] !== '/') {
        return '/' + path;
      }

      return path;
    }

    if (this.state.images == null) {
      //let course = this.props.course != null && this.props.course != '' ? this.props.course : 'no-course';
      let document = this.props.document != null && this.props.document != '' ? this.props.document : 'base';
      API.media.getImages({ document: document })
      .then(data => {
        let imageArray = JSON.parse(data.files);
        let images = [];
        imageArray.map(path => {
          let newImage = {};
          newImage.path = addLeadingSlash(path);
          newImage.filename = getFilenameFromPath(path);
          images.push(newImage);
        });

        this.setState({
          images: images
        });
      })
      .catch(err => {
        this.context.messageList.showMessage(Severity.Error, err);
      });
    }
  }

  onImageClick(src) {
    if (this.props.onInsertImage) {
      this.props.onInsertImage.call(null, src);
    }
  }

  render() {
    const images = this.state.images || [];
    return (
      <div className="">
        <p className="text-muted">Klicken Sie auf ein Bild, um dieses in das Dokument einzufügen. Klicken auf den angezeigten Link, um das Bild in einem neuen Tab zu öffnen.</p>
        <div className="image-gallery">
          <ul className="list-unstyled row">
            <li className="">
              <ImageUpload onInsertImage={this.props.onInsertImage} document={this.props.document} />
            </li>
              { images.map(img => {
                return (<li className="" key={img.path}>
                  <ImagePreview width={MAX_WIDTH} src={img.path} filename={img.filename} onClick={this.onImageClick} />
                </li>);
              })}

          </ul>
        </div>
      </div>
    );
  }
}

ImageGallery.propTypes = {
  onInsertImage: PropTypes.func.isRequired,
  course: PropTypes.string,
  document: PropTypes.string
};

ImageGallery.defaultProps = {
};

ImageGallery.contextTypes = {
  messageList: PropTypes.object
};