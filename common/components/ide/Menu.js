import React from 'react';
import set from 'lodash/set';
import screenfull from 'screenfull';

import optionManager from '../../models/options';

import Icon from '../Icon';
import { NavDropdown, DropdownItem, DropdownDivider, Button } from '../bootstrap';
import { generateZip, saveZipAsFile, saveTextAsFile } from '../../util/saveUtil';

export default class Menu extends React.Component {
  componentWillMount() {
    let input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.addEventListener('change', this.onImport.bind(this));

    this.input = input;
  }

  /**
   * Only rerender on a new project
   */
  shouldComponentUpdate(nextProps) {
    if (this.props.project != nextProps.project) {
      return true;
    }

    return false;
  }

  /**
   * Handler for creating new files. Delegates the file creation to the project model associated
   * with this Menu.
   *
   * @param e Event object
   */
  onNewFile(e) {
    e.preventDefault();

    this.props.project.addFile();
  }

  onOptions(e) {
    e.preventDefault();

    this.props.project.addTab('options');
  }

  onInsights(e) {
    e.preventDefault();

    this.props.project.showInsights();
  }

  onAttributes(e) {
    e.preventDefault();

    this.props.project.addTab('attributes', {item: this.props.project});
  }

  onNewTerminal(e) {
    e.preventDefault();

    this.props.project.exec('bash');
  }

  onImport(e) {
    e.preventDefault();

    // ToDo: add zip support
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

    const files = this.props.project.getFiles();
    const name = this.props.project.name;

    if (files.length === 0) {
      // Show Message
      return;
    } else if (files.length > 1) {
      const zipFile = generateZip(name, files);
      saveZipAsFile(name, zipFile);
    } else {
      // download as single file
      saveTextAsFile(files[0]);
    }
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

  onShowShareableLink(e) {
    e.preventDefault();
    this.props.project.showShareableLink();
  }

  renderStatisticsItem() {
    const userData = this.props.project.getUserData();
    if (userData.anonymous === true || userData.isAuthor === false) {
      return null;
    }

    return (
      <DropdownItem onClick={this.onInsights.bind(this)}>
        <Icon name="bar-chart" fixedWidth/> Statistiken
      </DropdownItem>
    );
  }

  renderEmbedAttributes() {
    const userData = this.props.project.getUserData();
    if (userData.anonymous === true || userData.isAuthor === false) {
      return null;
    }

    return (
      <DropdownItem onClick={this.onAttributes.bind(this)}>
        <Icon name="info" fixedWidth/> Eigenschaften
      </DropdownItem>
    );
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

        <DropdownItem onClick={this.onShowShareableLink.bind(this)}>
          <Icon name="share" fixedWidth/> Teilen (Link)
        </DropdownItem>

        { this.renderStatisticsItem() }
        { this.renderEmbedAttributes() }

        {/*
        <DropdownItem>
          <Icon name="refresh" fixedWidth/> Zurücksetzen
        </DropdownItem>
        */}

        <DropdownDivider/>

        <DropdownItem onClick={this.input.click.bind(this.input)}>
          <Icon name="upload" fixedWidth/> Importieren
        </DropdownItem>

        <DropdownItem onClick={this.onExport.bind(this)}>
          <Icon name="download" fixedWidth title="Beispiel herunterladen" /> Exportieren
        </DropdownItem>

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
