import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';

import { Severity } from '../../models/severity';
import ImagePreview from './ImagePreview';
import ImageUpload from './ImageUpload';
import { API } from '../../services';

const MAX_WIDTH = 200;

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class ImageGallery extends React.Component {
  constructor(props) {
    super(props);

    this.onImageClick = this.onImageClick.bind(this);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
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
      // ToDo: Handle undefined course
      let course = this.props.course != null ? this.props.course : 'no-course';
      API.media.getImages({ course: course })
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
      <div>
        <p className="text-muted">Klicken Sie auf ein Bild, um dieses in das Dokument einzufügen. Klicken auf den angezeigten Link, um das Bild in einem neuen Tab zu öffnen.</p>
        <div className="card-columns">
          <ImageUpload onInsertImage={this.props.onInsertImage} course={this.props.course} />
          { images.map(img => {
            return <ImagePreview width={MAX_WIDTH} key={img.path} src={img.path} filename={img.filename} onClick={this.onImageClick} />;
          })}
        </div>
      </div>
    );
  }
}

ImageGallery.propTypes = {
  onInsertImage: React.PropTypes.func.isRequired,
  course: React.PropTypes.object.isRequired
};

ImageGallery.defaultProps = {
};

ImageGallery.contextTypes = {
  messageList: React.PropTypes.object
};