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

import React from 'react';

class VerticalScrollbar extends React.Component {

  constructor() {
    super();
    this.state = {
      height: 0,
      dragging: false,
      start: 0
    };
  }

  render(){
    if (this.state.height < 100) {
      return(
        <div
          className="react-scrollbar__scrollbar-vertical"
          ref="container"
          onClick={ this.jump.bind(this) }>

          <div
            className={ "scrollbar" + ( this.state.dragging || this.props.draggingFromParent ? '' : ' react-scrollbar-transition') }
            ref="scrollbar"
            onTouchStart={ this.startDrag.bind(this) }
            onMouseDown={ this.startDrag.bind(this) }
            style={{
              height: this.state.height+'%',
              top: this.props.scrolling + '%'
            }} />

        </div>
      );
    } else {
      return null;
    }
  }


  startDrag(e){

    e.preventDefault();
    e.stopPropagation();

    e = e.changedTouches ? e.changedTouches[0] : e;

    // Prepare to drag
    this.setState({
      dragging: true,
      start: e.clientY
    });
  }

  onDrag(e){

    if (this.state.dragging) {

      // Make The Parent being in the Dragging State
      this.props.onDragging();

      e.preventDefault();
      e.stopPropagation();

      e = e.changedTouches ? e.changedTouches[0] : e;

      let yMovement = e.clientY - this.state.start;
      let yMovementPercentage = yMovement / this.props.wrapper.height * 100;

      // Update the last e.clientY
      this.setState({ start: e.clientY }, () => {

        // The next Vertical Value will be
        let next = this.props.scrolling + yMovementPercentage;

        // Tell the parent to change the position
        this.props.onChangePosition(next, 'vertical');
      });
    }
  }

  stopDrag(e){
    if (this.state.dragging) {
      // Parent Should Change the Dragging State
      this.props.onStopDrag();
      this.setState({ dragging: false });
    }
  }

  jump(e){

    let isContainer = e.target === this.refs.container;

    if (isContainer) {
      // Get the Element Position
      let position = this.refs.scrollbar.getBoundingClientRect();

      // Calculate the vertical Movement
      let yMovement = e.clientY - position.top;
      let centerize = (this.state.height / 2);
      let yMovementPercentage = yMovement / this.props.wrapper.height * 100 - centerize;

      // Update the last e.clientY
      this.setState({ start: e.clientY }, () => {

        // The next Vertical Value will be
        let next = this.props.scrolling + yMovementPercentage;

        // Tell the parent to change the position
        this.props.onChangePosition(next, 'vertical');

      });
    }
  }

  calculateSize(source){
    // Scrollbar Height
    this.setState({ height: source.wrapper.height / source.area.height * 100 });
  }

  componentWillReceiveProps(nextProps) {
    if ( nextProps.wrapper.height !== this.props.wrapper.height ||
        nextProps.area.height !== this.props.area.height ) {
      this.calculateSize(nextProps);
    }
  }

  componentDidMount() {
    this.calculateSize(this.props);

    // Put the Listener
    document.addEventListener("mousemove", this.onDrag.bind(this));
    document.addEventListener("touchmove", this.onDrag.bind(this));
    document.addEventListener("mouseup", this.stopDrag.bind(this));
    document.addEventListener("touchend", this.stopDrag.bind(this));
  }

  componentWillUnmount() {
    // Remove the Listener
    document.removeEventListener("mousemove", this.onDrag.bind(this));
    document.removeEventListener("touchmove", this.onDrag.bind(this));
    document.removeEventListener("mouseup", this.stopDrag.bind(this));
    document.removeEventListener("touchend", this.stopDrag.bind(this));
  }

}

export default VerticalScrollbar;