import React from 'react';
import ResizeDetector from '../../ResizeDetector';
import round from 'lodash/round';

export default class TurtlePanel extends React.Component {
  constructor(props) {
    super(props);

    this.onRef = this.onRef.bind(this);
    this.onResize = this.onResize.bind(this);

    this.state = {
      zoomFactor: 1
    };
  }

  componentWillUnmount() {
    // Cleanup any old references and adde dom nodes,
    if (this.turtleContainer) {
      while (this.turtleContainer.firstChild) {
        this.turtleContainer.removeChild(this.turtleContainer.firstChild);
      }
    }
  }

  /**
   * Gets called when the turtle container has been rendered.
   * The ref is the actual DOMNode and allows us to append existing nodes.
   *
   * @param {DOMNode} ref - dom node reference
   * @returns {void}
   * @memberOf TurtlePanel
   */
  onRef(ref) {
    if (ref) {
      this.turtleContainer = ref;
      ref.appendChild(this.props.item.canvas);
      this.recalculateZoomFactor(...this.getContainerSize());
    }
  }

  /**
   * Event handler for dimension changes of the panel.
   *
   * @param {any} width - width of the panel
   * @param {any} height - height of the panel
   * @returns {void}
   * @memberOf TurtlePanel
   */
  onResize(width, height) {
    this.recalculateZoomFactor(width, height);
  }

  /**
   * Returns the width and height of the turtle container parent (panel).
   *
   * @returns {Array|null} an Array [width, height] or null if information is not available
   *
   * @memberOf TurtlePanel
   */
  getContainerSize() {
    if (this.turtleContainer && this.turtleContainer.parentElement) {
      return [
        this.turtleContainer.parentElement.offsetWidth,
        this.turtleContainer.parentElement.offsetHeight,
      ];
    }

    return null;
  }

  /**
   * Calculates a zooming factor so that the canvas can be displayed within the panel.
   *
   * @param {any} width - width of the panel
   * @param {any} height - height of the panel
   * @returns {void}
   *
   * @memberOf TurtlePanel
   */
  recalculateZoomFactor(width, height) {
    if (width == null || height == null) {
      return;
    }

    const canvasWidth = this.props.item.canvas.width;
    const canvasHeight = this.props.item.canvas.height;

    if (canvasWidth == null || canvasHeight == null) {
      return;
    }

    const wFactor = width / canvasWidth;
    const hFactor = height / canvasHeight;
    let factor;

    // if we need to choose the smallest factor if we need to reduce the size
    if (Math.min(wFactor, hFactor) < 1) {
      factor = Math.max(Math.min(wFactor, hFactor), 0.5);
    } else {
      // otherwise choose the max factor
      factor = Math.min(Math.max(wFactor, hFactor), 2);
    }

    factor = round(factor, 2);

    // Triggers rerendering if factor changes
    this.setState({
      zoomFactor: factor
    });
  }

  render() {
    return (
      <div className="turtle-panel">
        <h1>Turtle-Ausgabe</h1>
        <div ref={this.onRef} style={{ zoom: this.state.zoomFactor }}></div>
        <ResizeDetector handleWidth handleHeight onResize={this.onResize} />
      </div>
    );
  }
}
