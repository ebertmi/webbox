import React from 'react';
import PropTypes from 'prop-types';

import TabBar from './TabBar';
import { StatusBar } from './StatusBar';
import PanelArea from './PanelArea';
import Debug from 'debug';
import noop from 'lodash/noop';

const debug = Debug('webbox:ide');

function loadedInIFrame () {
  return window.frameElement && window.frameElement.nodeName == 'IFRAME';
}

export default class Ide extends React.Component {
  constructor(props) {
    super(props);
    this.onDrop = this.onDrop.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  componentDidMount() {
    // handle Ctrl+S on the whole document even when nothing is focused
    if (this.props.noWindowHandlers === false) {
      document.addEventListener('keydown', this.onKeyDown);
    }

    // ToDo: Add a check for unsaved changes!
    addEventListener('beforeunload', event => {
      if (this.props.project.canSave(false) === false) {
        return false;
      }

      // Do not bother users with iFrame or IDEWrappers stuff
      // ToDo: should we limit this on presentations only?
      if ((loadedInIFrame()) || this.props.noWindowHandlers) {
        return false;
      }

      // If there are not any changes, just close it
      if (this.props.project.hasUnsavedChanges === false) {
        return false;
      }

      event.returnValue = 'Bitte speichere ggf. noch deine Änderungen!';
      return 'Bitte speichere ggf. noch deine Änderungen!';
    });

    // Try to give back the focus to the parent
    if (loadedInIFrame()) {
      if (window.parent && window.parent.focus) {
        try {
          window.parent.focus();
        } catch (e) {
          // Dismiss, we tried but failed
          debug('Failed to give the parent the focus back.');
        }
      }
    }
  }

  onDrop(e) {
    e.preventDefault();

    const files = e.dataTransfer.files;
    const project = this.props.project;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();

      reader.onload = () => {
        project.addFile(file.name, reader.result);
      };

      reader.readAsText(file);
    }
  }

  /**
   * Check for global key codes and bindings for commands
   * @param {Event} e - Key Event
   * @returns {void}
   */
  onKeyDown(e) {
    const key = e.which || e.keyCode;

    // Check for Ctrl+S and try to save the document if possible
    if ((e.metaKey || (e.ctrlKey && !e.altKey)) && key === 83) {

      // SaveEmbed is debounced
      this.props.project.saveEmbed();
      e.preventDefault();
    } else if ((e.metaKey || (e.ctrlKey && !e.altKey)) && key === 66) {
      // Run/Stop current programm Ctrl+E
      const project = this.props.project;

      if (project.isRunning()) {
        project.stop();
      } else {
        project.run();
      }

      e.preventDefault();
    }
  }

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  render() {
    const keyDownHandler = this.props.noWindowHandlers ? this.onKeyDown : noop;

    return (
      <div className="ide" onKeyDown={keyDownHandler} onDragOver={this.onDragOver} onDrop={this.onDrop} ref={div => this.container = div}>
        <TabBar project={this.props.project}/>
        <PanelArea project={this.props.project} messageList={this.props.messageList} />
        <StatusBar registry={this.props.project.statusBarRegistry}/>
        <script dangerouslySetInnerHTML={{__html: `var project =${this.props.project}`}} />
      </div>
    );
  }
}

Ide.propTypes = {
  noWindowHandlers: PropTypes.bool,
  project: PropTypes.object.isRequired,
  messageList: PropTypes.object.isRequired
};

Ide.defaultProps = {
  noWindowHandlers: false
};