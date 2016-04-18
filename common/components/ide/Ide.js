import React from 'react';

import TabBar from './TabBar';
import PanelArea from './PanelArea';

export default class Ide extends React.Component {
  //constructor(props) {
  //super(props);

  //this.sourcebox = new Sourcebox('http://52.58.54.59/', {
  //auth: 'eyJhbGciOiJIUzI1NiJ9.Zm9v.opx1-KK6j1FQ5cM3YOv3dZOeSxzt3OlfkP4kr4pM5bA'
  //});
  //}

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
        <PanelArea project={this.props.project}/>
      </div>
    );
  }
}
