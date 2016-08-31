import React from 'react';

import TabBar from './TabBar';
import { StatusBar } from './StatusBar';
import PanelArea from './PanelArea';
import Debug from 'debug';

const debug = Debug('webbox:ide');

export default class Ide extends React.Component {
  constructor(props) {
    super(props);

    this.onDrop = this.onDrop.bind(this);
  }

  componentDidMount() {
    // handle Ctrl+S on the whole document even when nothing is focused
    document.addEventListener('keydown', this.onKeyDown.bind(this));

    window.addEventListener("beforeunload", e => {
      debug('beforeunload', e);

      // Check if the user can save, if not we can close
      if (this.props.project.canSave() === false) {
        return;
      }

      // Do something
      /* ToDo:
       *  - check if user can save
       *  - Ask if we should save
       *  - Save and close
       */
    }, false);
  }

  onDrop(e) {
    e.preventDefault();

    let files = e.dataTransfer.files;
    let project = this.props.project;

    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      let reader = new FileReader();

      reader.onload = () => {
        project.addFile(file.name, reader.result);
      };

      reader.readAsText(file);
    }
  }

  /**
   * Check for Ctrl+S and try to save the document if possible
   */
  onKeyDown(e) {
    let key = e.which || e.keyCode;
    if ((e.metaKey || (e.ctrlKey && !e.altKey)) && key === 83) {

      // SaveEmbed is debounced
      this.props.project.saveEmbed();
      e.preventDefault();
    }
  }

  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  render() {
    return (
      <div className="ide" onDragOver={this.onDragOver} onDrop={this.onDrop} ref={div => this.container = div}>
        <TabBar project={this.props.project}/>
        <PanelArea project={this.props.project} messageList={this.props.messageList} />
        <StatusBar registry={this.props.project.statusBarRegistry}/>
      </div>
    );
  }
}
