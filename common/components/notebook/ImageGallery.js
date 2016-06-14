import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';

import ImagePreview from './ImagePreview';
import { API } from '../../services';

const MAX_WIDTH = 200;

/**
 * The Notebook-Component renders the different cells with a component according to its cell_type.
 */
export default class ImageGallery extends React.Component {
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
      API.media.getImages({ course: this.props.course })
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
        console.log(err);
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
