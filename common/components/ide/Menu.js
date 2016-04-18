import React from 'react';

import screenfull from 'screenfull';

import Icon from '../Icon';
import {NavDropdown, DropdownItem, DropdownDivider} from '../bootstrap';

export default class Menu extends React.Component {
  componentWillMount() {
    let input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.addEventListener('change', this.onImport.bind(this));

    this.input = input;
  }

  onNewFile(e) {
    e.preventDefault();

    // TODO use bootstrap modal
    let filename = prompt('Dateiname?');

    if (filename) {
      this.props.project.addFile(filename);
    }
  }

  onOptions(e) {
    e.preventDefault();

    this.props.project.addTab('options');
  }

  onNewTerminal(e) {
    e.preventDefault();

    this.props.project.exec('bash');
  }

  onImport(e) {
    e.preventDefault();

    // TODO move this into project
    let files = e.target.files;
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

  onExport(e) {
    e.preventDefault();

    // TODO, maybe add all files to a zip?
    //let files = this.project.getFiles();
  }

  onToggleFullscreen() {
    if (screenfull.enabled) {
      screenfull.toggle();
    }
  }

  render() {
    let project = this.props.project;

    let newTerminal;

    if (project.exec) {
      newTerminal = (
            <DropdownItem onClick={this.onNewTerminal.bind(this)}>
              <Icon name="terminal" fixedWidth/> Neues Terminal
            </DropdownItem>
      );
    }

    return (
      <NavDropdown title={<Icon name="bars"/>} right>
        <DropdownItem onClick={this.onNewFile.bind(this)}>
          <Icon name="file" fixedWidth/> Neue Datei
        </DropdownItem>

        {newTerminal}

        <DropdownDivider/>

        {/*
        <DropdownItem>
          <Icon name="refresh" fixedWidth/> Zurücksetzen
        </DropdownItem>
        */}

        <DropdownItem onClick={this.input.click.bind(this.input)}>
          <Icon name="upload" fixedWidth/> Importieren
        </DropdownItem>

        {/*
        <DropdownItem onClick={this.onExport.bind(this)}>
          <Icon name="download" fixedWidth/> Exportieren
        </DropdownItem>
        */}

        <DropdownDivider/>

        <DropdownItem onClick={this.onToggleFullscreen.bind(this)} disabled={!screenfull.enabled}>
          <Icon name="arrows-alt" fixedWidth/> Vollbildmodus
        </DropdownItem>

        <DropdownItem onClick={this.onOptions.bind(this)}>
          <Icon name="gear" fixedWidth/> Einstellungen
        </DropdownItem>
      </NavDropdown>
    );
  }
}
