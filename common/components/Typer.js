import React, { Component } from 'react';

function delay (ms) {
  return new Promise (function (resolve) {
    setTimeout(resolve, ms);
  });
}

/**
 * Provides a typewriter like effect.
 */
export class Typer extends Component {
  constructor(props) {
    super(props);

    this.state = Typer.getDefaultState();
  }

  componentDidMount () {
    this.play();
  }

  componentWillUnmount () {
    this.stop();
  }

  shouldComponentUpdate (nextProps, nextState) {
    if (this.state.sceneState !== nextState.sceneState ||
        this.state.currentSceneIndex !== nextState.currentSceneIndex ||
        this.state.status !== nextState.status) {
      return true;
    }

    // ToDo: check nextProps
    // check state
    if (this.props.breakDelay !== nextProps.breakDelay ||
        this.props.eraseDelay !== nextProps.eraseDelay ||
        this.props.typeDelay !== nextProps.typeDelay ||
        this.props.scenes.length !== nextProps.scenes.length) {
      return true;
    }

    // check scenes changes
    let i;
    for (i = 0; i < this.props.scenes; ++i) {
      if (this.props.scenes[i] !== nextProps.scenes[i]) {
        return true;
      }
    }

    return false;
  }

  cloneState () {
    const newState = {
      sceneState: this.state.sceneState,
      currentSceneIndex: this.state.currentSceneIndex,
      status: this.state.status,
      displayCursor: this.state.displayCursor
    };

    return newState;
  }

  type () {
    if (this.state.status !== 'playing') {
      return;
    }

    // get current scene's value
    const scene = this.props.scenes[this.state.currentSceneIndex];
    const state = this.cloneState();

    // check state and scene
    if (state.sceneState === scene) {
      // stop after displaying the complete scene
      if (this.props.autoStop && (state.currentSceneIndex + 1) === this.props.scenes.length) {
        state.displayCursor = false; // hide cursor
        state.status = 'ready';
        this.setState(state);
        return;
      }

      // break and then erase the content
      return delay(this.props.breakDelay).then(this.erase.bind(this));
    }

    // if we made it until there,
    // it means we still have some text to type
    // we want to type the next character
    // to do so we could get the current length
    // and get the relevant character, e.g:
    // scene.charAt(state.length + 1)
    // but once again, the text content of the
    // element could have been changed by
    // something else so instead we're taking
    // the scene's content from the start until
    // the next character

    state.sceneState = scene.substr(0, state.sceneState.length + 1);

    this.setState(state, () => {
      // after some delay, we're calling the same function
      // (the one we are currently in)
      // this way we'll type the next character if allowed/needed
      // or just call the erase function
      return delay(this.props.typeDelay).then(this.type.bind(this));
    });
  }

  erase () {
    if (this.state.status !== 'playing') {
      // same as type(), if the animation is not
      // playing, there's nothing to do and we can just return
      return;
    }

    const state = this.cloneState();

    if (state.sceneState === '') {
      // if the state is empty, it means
      // we have erased everything and we
      // want to play the next scene
      // which is basically the currentScene + 1
      state.currentSceneIndex++;

      // but the current scene could have been the last
      // if so, we want to loop over the scenario
      // and replay it from scratch, setting the current scene to 0
      if (state.currentSceneIndex === this.props.scenes.length) {
        state.currentSceneIndex = 0;
      }

      this.setState(state,  () => {
        // after some delay, erase the next character
        delay(this.props.breakDelay).then(this.type.bind(this));
      });

      return;
    }

    // ok so if we're there, it means there are
    // still some characters to erase
    const sceneState = this.state.sceneState.substr(0, this.state.sceneState.length - 1);
    state.sceneState = sceneState;
    this.setState(state, () => {
      // after some delay, erase the next character
      delay(this.props.eraseDelay).then(this.erase.bind(this));
    });
  }


  stop () {
    const state = this.cloneState();
    state.status = 'ready';
    this.setState(state);
  }

  play () {
    if (this.state.status === 'ready') {
      const state = this.cloneState();
      state.status = 'playing';
      this.setState(state, this.type.bind(this));
    }
  }

  render () {
    const cursor = this.state.displayCursor ? this.props.cursor : ' ';
    return (
      <span>{this.state.sceneState}<span className="typed-cursor">{cursor}</span></span>
    );
  }
}

Typer.propTypes = {
  scenes: React.PropTypes.array.isRequired,
  eraseDelay: React.PropTypes.number,
  typeDelay: React.PropTypes.number,
  breakDelay: React.PropTypes.number,
  autoStop: React.PropTypes.bool,
  cursor: React.PropTypes.string
};

Typer.defaultProps = {
  eraseDelay: 65,
  typeDelay: 100,
  breakDelay: 800,
  autoStop: true,
  cursor: '|'
};

Typer.getDefaultState = function () {
  return {
    status: 'ready',
    sceneState: '',
    currentSceneIndex: 0,
    displayCursor: true
  };
};