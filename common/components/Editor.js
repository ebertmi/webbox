import React from 'react';
import PropTypes from 'prop-types';
import ResizeDetector from './ResizeDetector';

const Monaco = window.monaco;

// "dumb" editor component

export default class Editor extends React.Component {
  constructor() {
    super();

    this.onResize = this.onResize.bind(this);
  }

  componentDidMount() {
    this.editor = monaco.editor.create(this.container);
    window.__editor = this.editor;
    this.updateProps(this.props);

    window.addEventListener("resize", this.onResize);
  }

  componentWillUnmount() {
     this.editor.dispose();
     window.removeEventListener("resize", this.onResize);
  }

  componentWillReceiveProps(next) {
    this.updateProps(next);
  }

  componentDidUpdate() {
    this.editor.layout();
  }

  onResize() {
    if (this.editor && this.editor.layout) {
      this.editor.layout();
    }
  }

  updateProps(props) {
    let {onBlur, minHeight, file, options} = props;

    if (file) {
      this.editor.setModel(props.file.model);
    }

    this.editor.updateOptions(options);

    if (options.theme) {
      monaco.editor.setTheme(options.theme)
    }
  }

  focus() {
    this.editor.focus();
  }

  render() {
    const { width, height } = this.props;
    const fixedWidth = width.toString().indexOf('%') !== -1 ? width : `${width}px`;
    const fixedHeight = height.toString().indexOf('%') !== -1 ? height : `${height}px`;
    const style = {
      width: fixedWidth,
      height: fixedHeight,
      display: 'block'
    };

    if (this.props.minHeight) {
      style.minHeight = this.props.minHeight;
    }

    return (
        //<div>
          <div style={style} ref={div => this.container = div} onBlur={this.props.onBlur} className="react-monaco-editor-container" />
        //  <ResizeDetector handleWidth handleHeight onResize={this.onResize} />
        //</div>
      )
  }

}

Editor.propTypes = {
  width: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  options: PropTypes.object
}

Editor.defaultProps = {
  width: '100%',
  height: '100%'
};