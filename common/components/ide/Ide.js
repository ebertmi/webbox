import React from 'react';

import TabBar from './TabBar';
import StatusBar from './StatusBar';
import PanelArea from './PanelArea';
import { Severity } from '../../models/severity';

export default class Ide extends React.Component {
  constructor(props) {
    super(props);
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
