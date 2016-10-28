/*The MIT License (MIT)

Copyright (c) 2016 Naufal Rabbani

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/
// Taken from https://github.com/BosNaufal/react-scrollbar and modified for our use cases.
import React from 'react';

import VerticalScrollbar from './VerticalScrollbar.js';
import HorizontalScrollbar from './HorizontalScrollbar.js';

//import './_scrollable.scss';

/**
 * Wraps a single child component with vertical and horizontal custom scrollbars.
 * If a scroll, drag or scrollbar event occurs the new offset is fired in a event.
 * The wrapped component must take care of the offset.
 *
 * @class ScrollableElement
 * @extends {React.Component}
 */
class ScrollableElement extends React.Component {
  constructor() {
    super();
    this.state = {
      ready: true,
      top: 0,
      left: 0,
      scrollAreaHeight: null,
      scrollAreaWidth: null,
      scrollWrapperHeight: null,
      scrollWrapperWidth: null,
      verticalHeight: null,
      vMovement: 0,
      hMovement: 0,
      dragging: false,
      start: { y: 0, x: 0}
    };
  }

  render(){
    return(
        <div onClick={ this.calculateSize.bind(this) }
          className={ "react-scrollbar__wrapper" + ( this.props.className ? " " + this.props.className : "" ) }
          ref="scrollWrapper"
          style={this.props.style}>
          <div className={ "react-scrollbar__area" + ( this.state.dragging ? ' ' : ' react-scrollbar-transition') }
            ref="scrollArea"
            style={{width: "100%"}}
            onWheel={ this.scroll.bind(this) }
            onTouchStart={ this.startDrag.bind(this) }
            onTouchMove={ this.onDrag.bind(this) }
            onTouchEnd={ this.stopDrag.bind(this) }>
            { this.props.children }
          </div>
      { this.state.ready ?
        <VerticalScrollbar
          area={{ height: this.state.scrollAreaHeight }}
          wrapper={{ height: this.state.scrollWrapperHeight }}
          scrolling={ this.state.vMovement }
          draggingFromParent={ this.state.dragging }
          onChangePosition={ this.handleChangePosition.bind(this) }
          onDragging={ this.handleScrollbarDragging.bind(this) }
          onStopDrag={ this.handleScrollbarStopDrag.bind(this) } />
      : null }

      { this.state.ready ?
        <HorizontalScrollbar
          ref="horizontalScrollbar"
          area={{ width: this.state.scrollAreaWidth }}
          wrapper={{ width: this.state.scrollWrapperWidth }}
          scrolling={ this.state.hMovement }
          draggingFromParent={ this.state.dragging }
          onChangePosition={ this.handleChangePosition.bind(this) }
          onDragging={ this.handleScrollbarDragging.bind(this) }
          onStopDrag={ this.handleScrollbarStopDrag.bind(this) } />
      : null }
        </div>
    );
  }

  scroll(e){
    e.preventDefault();
    e.persist();

    // Make sure the content height is not changed
    this.calculateSize(() => {
      // Set the wheel step
      let num = this.props.speed;
      let deltaX = e.deltaX;
      let deltaY = e.deltaY;

      // Should we apply vertical scroll to horizontal?
      if (this.props.scrollYToX && !deltaX) {
        deltaX = deltaY;
        deltaY = 0;
      }

      // DOM events
      let scrollY = deltaY > 0 ? num : -(num);
      let scrollX = deltaX > 0 ? num : -(num);

      // Next Value
      let nextY = this.state.top + scrollY;
      let nextX = this.state.left + scrollX;

      // Is it Scrollable?
      let canScrollY = this.state.scrollAreaHeight > this.state.scrollWrapperHeight;
      let canScrollX = this.state.scrollAreaWidth > this.state.scrollWrapperWidth;

      // Vertical Scrolling
      if (canScrollY) {
        this.normalizeVertical(nextY);
      }

      // Horizontal Scrolling
      if (canScrollX) {
        this.normalizeHorizontal(nextX);
      } else {
        this.setState({
          left: 0
        });
        this.setHorizontalScroll(0);
      }
    });
  }

  /**
   * Fires a scroll left event to the wrapped component callback
   *
   * @param {any} offset
   */
  setHorizontalScroll(offset) {
    if (this.props.onScroll) {
      this.props.onScroll({
        scrollLeft: offset
      });
    }
  }

  /**
   * Fires a scroll top event to the wrapped component callback
   *
   * @param {any} offset
   */
  setVerticalScroll(offset) {
    if (this.props.onScroll) {
      this.props.onScroll({
        scrollTop: offset
      });
    }
  }

  // DRAG EVENT JUST FOR TOUCH DEVICE~
  startDrag(e){
    e = e.changedTouches ? e.changedTouches[0] : e;

    // Make sure the content height is not changed
    this.calculateSize(() => {
      // Prepare to drag
      this.setState({
        dragging: true,
        start: { y: e.pageY, x: e.pageX }
      });
    });
  }

  onDrag(e){
    if(this.state.dragging){
      e = e.changedTouches ? e.changedTouches[0] : e;

      // Invers the Movement
      let yMovement = this.state.start.y - e.pageY;
      let xMovement = this.state.start.x - e.pageX;

      // Update the last e.page
      this.setState({ start: { y: e.pageY, x: e.pageX } });

      // The next Vertical Value will be
      let nextY = this.state.top + yMovement;
      let nextX = this.state.left + xMovement;

      this.normalizeVertical(nextY);
      this.normalizeHorizontal(nextX);
    }
  }

  stopDrag(){
    this.setState({ dragging: false });
  }

  normalizeVertical(next){

    // Vertical Scrolling
    let lowerEnd = this.state.scrollAreaHeight - this.state.scrollWrapperHeight;

    // Max Scroll Down
    if (next > lowerEnd) {
      next = lowerEnd;
    } else if (next < 0) {
      // Max Scroll Up
      next = 0;
    }

    this.setVerticalScroll(next);

    // Update the Vertical Value
    this.setState({
      top: next,
      vMovement: next / this.state.scrollAreaHeight * 100
    });
  }

  normalizeHorizontal(next){
    // Horizontal Scrolling
    let rightEnd = this.state.scrollAreaWidth - this.state.scrollWrapperWidth;

    // Max Scroll Right
    if (next > rightEnd) {
      next = rightEnd;
    } else if (next < 0) {
      // Max Scroll Right
      next = 0;
    }

    this.setHorizontalScroll(next);

    // Update the Horizontal Value
    this.setState({
      left: next,
      hMovement: next / this.state.scrollAreaWidth * 100
    });
  }

  handleChangePosition(movement, orientation){
    // Make sure the content height is not changed
    this.calculateSize(() => {
      // Convert Percentage to Pixel
      let next = movement / 100;
      if ( orientation == 'vertical' ) {
        this.normalizeVertical( next * this.state.scrollAreaHeight );
      }

      if ( orientation == 'horizontal' ) {
        this.normalizeHorizontal( next * this.state.scrollAreaWidth );
      }
    });
  }

  handleScrollbarDragging(){
    this.setState({ dragging: true });
  }

  handleScrollbarStopDrag(){
    this.setState({ dragging: false });
  }

  getSize(){
    // The Elements
    let $scrollWrapper = this.refs.scrollWrapper;
    let $scrollArea = this.refs.scrollArea;

    // Get new Elements Size
    let elementSize = {
      // Scroll Area Height and Width
      scrollAreaHeight: $scrollArea.children[0].scrollHeight,
      scrollAreaWidth: $scrollArea.children[0].scrollWidth,

      // Scroll Wrapper Height and Width
      scrollWrapperHeight: $scrollWrapper.clientHeight,
      scrollWrapperWidth: $scrollWrapper.clientWidth,
    };

    return elementSize;
  }

  calculateSize(cb){
    if (typeof(cb)!='function') {
      cb = null;
    }

    let elementSize = this.getSize();

    if ( elementSize.scrollWrapperHeight != this.state.scrollWrapperHeight ||
        elementSize.scrollWrapperWidth != this.state.scrollWrapperWidth ||
        elementSize.scrollAreaHeight != this.state.scrollAreaHeight ||
        elementSize.scrollAreaWidth != this.state.scrollAreaWidth ) {

      // Check if we need to reset the left and top and movement values
      let left = this.state.left;
      let vMovement = this.state.vMovement;
      if (elementSize.scrollAreaWidth <= elementSize.scrollWrapperWidth) {
        left = 0;
        vMovement = 0;
      }

      let top = this.state.top;
      let hMovement = this.state.hMovement;
      if (elementSize.scrollAreaHeight <= elementSize.scrollWrapperHeight) {
        top = 0;
        hMovement = 0;
      }

      this.setState({

        // Scroll Area Height and Width
        scrollAreaHeight: elementSize.scrollAreaHeight,
        scrollAreaWidth: elementSize.scrollAreaWidth,

        // Scroll Wrapper Height and Width
        scrollWrapperHeight: elementSize.scrollWrapperHeight,
        scrollWrapperWidth: elementSize.scrollWrapperWidth,

        // Make sure The wrapper is Ready, then render the scrollbar
        ready: true,
        left,
        top,
        vMovement,
        hMovement
      }, () => cb ? cb() : false);
    } else {
      return cb ? cb() : false;
    }
  }

  componentDidMount() {
    this.calculateSize(() => {
      //this.normalizeHorizontal(0);
      //this.normalizeVertical(0);
    });

    // Attach The Event for Responsive View~
    window.addEventListener('resize', this.calculateSize.bind(this));
  }

  componentWillUnmount(){
    // Remove Event
    window.removeEventListener('resize', this.calculateSize.bind(this));
  }

}

// The Props
ScrollableElement.propTypes = {
  speed: React.PropTypes.number,
  className: React.PropTypes.string,
  style: React.PropTypes.object,
  scrollYToX: React.PropTypes.bool,
  onScroll: React.PropTypes.func.isRequired
};

ScrollableElement.defaultProps = {
  speed: 53,
  className: "",
  style: {  },
  scrollYToX: false
};

export default ScrollableElement;