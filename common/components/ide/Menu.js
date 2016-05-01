import React from 'react';
import set from 'lodash/set';
import screenfull from 'screenfull';

import optionManager from '../../models/options';

import Icon from '../Icon';
import {NavDropdown, DropdownItem, DropdownDivider, Button} from '../bootstrap';

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

    // TODO what about duplicate files?
    // maybe we should also create the files on the disk...
    if (filename) {
      this.props.project.addFile(filename);
    }
  }

  onOptions(e) {
    e.preventDefault();

    this.props.project.addTab('options');
  }

  onInsights(e) {
    e.preventDefault();

    this.props.project.addTab('insights');
  }

  onAttributes(e) {
    e.preventDefault();

    this.props.project.addTab('attributes');
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

  changeFontSize(delta) {
    let fontSize = optionManager.getOptions().fontSize;
    fontSize += delta;

    let options = set({}, 'fontSize', fontSize);
    optionManager.setOptions(options);
  }

  onSmallerFontsize(e) {
    e.preventDefault();
    this.changeFontSize(-2);
  }

  onBiggerFontsize(e) {
    e.preventDefault();
    this.changeFontSize(2);
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

        {/* ToDo: add here a check if the user may have access to those items */}
        <DropdownItem onClick={this.onInsights.bind(this)}>
          <Icon name="bar-chart" fixedWidth/> Statistiken
        </DropdownItem>

        <DropdownItem onClick={this.onAttributes.bind(this)}>
          <Icon name="info" fixedWidth/> Eigenschafaten
        </DropdownItem>

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

        <form className="form-inline" onSubmit={e => e.preventDefault()}>
          <Button name="fontSizeSmaller" className="btn-sm fontSizeMenuBtn" onClick={this.onSmallerFontsize.bind(this)}>
            <Icon name="minus" fixedWidth />
          </Button>
          Schriftgröße
          <Button name="fontSizeBigger" className="btn-sm fontSizeMenuBtn" onClick={this.onBiggerFontsize.bind(this)}>
            <Icon name="plus" fixedWidth/>
          </Button>
        </form>

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
