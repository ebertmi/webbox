import React from 'react';

import TabBar from './TabBar';
import StatusBar from './StatusBar';
import PanelArea from './PanelArea';

export default class Ide extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // handle Ctrl+S on the whole document even when nothing is focused
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  onDrop(e) {
    e.preventDefault();

    let files = e.dataTransfer.files;
    let project = this.props.project;

    // TODO move this into project
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

      // ToDo: debounce or throttle the calls?
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
      <div className="ide" onDragOver={this.onDragOver} onDrop={this.onDrop.bind(this)} ref={div => this.container = div}>
        <TabBar project={this.props.project}/>
        <PanelArea project={this.props.project} messageList={this.props.messageList} />
        <StatusBar project={this.props.project}/>
      </div>
    );
  }
}
