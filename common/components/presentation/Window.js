import React from 'react';

export default class Window extends React.Component {
  constructor( props ) {
    super( props );
    this.state = {
      isMaximized: false
    };
  }

  componentDidMount() {
    document.addEventListener( 'keydown', this.toggleMaximize );
  }

  componentDidUpdate( prevProps, prevState ) {
    if ( this.mainRef ) {
      this.mainRef.scrollTop = this.mainRef.scrollHeight;
    }
  }

  componentWillUnmount() {
    document.removeEventListener( 'keydown', this.toggleMaximize );
  }

  toggleMaximize = ( e ) => {
    if ( e.altKey && e.keyCode === 77 ) {
      this[ `handle${ this.state.isMaximized ? 'Minimize' : 'Expand' }` ]();
    }
  }

  handleMinimize = () => {
    this.setState( { isMaximized: false } );
  }

  handleExpand = () => {
    this.setState( { isMaximized: true } );
    this.terminalRef.closest( '.spectacle-content' ).style.transform = 'none';
  }

  renderWindow() {

    <section ref={ elem => { this.mainRef = elem; }} style={ Object.assign( {}, style.main, this.state.isMaximized ? style.mainMaximized : {} ) }>
      { this.props.children }
    </section>;
  }

  render() {
    const { title } = this.props;
    const { isMaximized } = this.state;

    return (
      <div
        style={ !isMaximized ? style.container : style.containerMaximized }
        ref={ elem => { this.terminalRef = elem; }}>
        <header style={ style.header }>
          <nav style={ style.nav }>
            <button onClick={ this.handleMinimize }style={ { ...style.button, ...style.buttonMinimize }} title="Minimieren"><span style={style.buttonIcon} className="fa fa-window-restore" aria-hidden="true"></span></button>
            <button onClick={ this.handleExpand } style={ { ...style.button, ...style.buttonExpand }} title="Erweitern"><span style={style.buttonIcon} className="fa fa-window-maximize" aria-hidden="true"></span></button>
          </nav>
          <div style={ style.title }>{ title }</div>
        </header>
        <section ref={ elem => { this.mainRef = elem; }} style={ Object.assign( {}, style.main, this.state.isMaximized ? style.mainMaximized : {} ) }>
          { this.props.children }
        </section>
      </div>
    );
  }
}

export const style = {
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  containerMaximized: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    bottom: '3rem',
    left: '1rem',
  },
  header: {
    position: 'relative',
    padding: '8px',
    backgroundColor: '#E0E9F0',
    borderTopLeftRadius: '0px',
    borderTopRightRadius: '0px',
  },
  nav: {
    display: 'flex',
    textAlign: 'left'
  },
  title: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '0.58em'
  },
  button: {
    border: 'none',
    borderRadius: '50%',
    height: '15px',
    width: '15px',
    marginRight: '5px',
    backgroundColor: 'transparent'
  },
  buttonClose: {
    /*backgroundColor: '#EE5057'*/
  },
  buttonMinimize: {
    /*backgroundColor: '#DEC612'*/
  },
  buttonExpand: {
    /*backgroundColor: '#33B969'*/
  },
  buttonIcon: {
    fontSize: '10px',
    position: 'fixed',
    marginLeft: '-5px',
    marginTop: '-5px'
  },
  main: {
    backgroundColor: 'rgba(248, 248, 248, 1)',
    border: '1px solid rgb(224, 233, 240)',
    color: 'black',
    fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
    fontSize: '0.58em',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    hyphens: 'none',
    height: '100%',
    maxHeight: '400px',
    overflow: 'auto'
  },
  mainMaximized: {
    height: '100%',
    maxHeight: 'none'
  }
};