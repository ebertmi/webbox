import React from 'react';
import set from 'lodash/set';

import optionManager from '../../models/options';

import Icon from '../Icon';
import { NavDropdown, DropdownItem, DropdownDivider, Button } from '../bootstrap';
import { generateZip, saveZipAsFile, saveTextAsFile } from '../../util/saveUtil';

export default class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.onInsights = this.onInsights.bind(this);
    this.onImport = this.onImport.bind(this);
    this.onExport = this.onExport.bind(this);
    this.onOpenInNewWindow = this.onOpenInNewWindow.bind(this);
    this.onAttributes = this.onAttributes.bind(this);
    this.onTests = this.onTests.bind(this);
    this.onOptions = this.onOptions.bind(this);
    this.onNewTerminal = this.onNewTerminal.bind(this);
    this.onResetProject = this.onResetProject.bind(this);
    this.onNewFile = this.onNewFile.bind(this);
    this.onShowShareableLink = this.onShowShareableLink.bind(this);
    this.onBiggerFontsize = this.onBiggerFontsize.bind(this);
    this.onSmallerFontsize = this.onSmallerFontsize.bind(this);
  }

  componentWillMount() {
    let input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.addEventListener('change', this.onImport);

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

  onResetProject(e) {
    e.preventDefault();

    this.props.project.reset();
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

    this.props.project.tabManager.addTab('options');
  }

  onInsights(e) {
    e.preventDefault();

    this.props.project.showInsights();
  }

  onAttributes(e) {
    e.preventDefault();

    this.props.project.tabManager.addTab('attributes', { item: this.props.project });
  }

  onTests(e) {
    e.preventDefault();

    this.props.project.tabManager.addTab('tests', { item: this.props.project });
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
      saveTextAsFile(name, files[0]);
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

  onOpenInNewWindow(e) {
    e.preventDefault();
    let link = this.props.project.getSharableLink();
    window.open(link, '_blank');
  }

  renderStatisticsItem() {
    const userData = this.props.project.getUserData();
    if (userData.anonymous === true || userData.isAuthor === false) {
      return null;
    }

    return (
      <DropdownItem onClick={this.onInsights}>
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
      <DropdownItem onClick={this.onAttributes}>
        <Icon name="info" fixedWidth/> Eigenschaften
      </DropdownItem>
    );
  }

  renderTests() {
    const userData = this.props.project.getUserData();
    if (userData.anonymous === true || userData.isAuthor === false) {
      return null;
    }

    return (
      <DropdownItem onClick={this.onTests}>
        <Icon name="check-square-o" fixedWidth/> Tests
      </DropdownItem>
    );
  }

  render() {
    let project = this.props.project;

    let newTerminal;
    let resetProject;

    if (project.exec) {
      newTerminal = (
            <DropdownItem onClick={this.onNewTerminal}>
              <Icon name="terminal" fixedWidth/> Neues Terminal
            </DropdownItem>
      );
    }

    if (project.reset) {
      resetProject = (
        <DropdownItem onClick={this.onResetProject}>
          <Icon name="refresh" fixedWidth/> Zurücksetzen
        </DropdownItem>
      );
    }

    return (
      <NavDropdown className="unselectable" title={<Icon name="bars"/>} right>
        <DropdownItem onClick={this.onNewFile}>
          <Icon name="file" fixedWidth/> Neue Datei
        </DropdownItem>

        {newTerminal}

        <DropdownDivider/>

        <DropdownItem onClick={this.onShowShareableLink}>
          <Icon name="share" fixedWidth/> Teilen (Link)
        </DropdownItem>

        { this.renderStatisticsItem() }
        { this.renderEmbedAttributes() }
        { this.renderTests() }

        <DropdownDivider/>

        {resetProject}

        <DropdownItem onClick={this.input.click.bind(this.input)}>
          <Icon name="upload" fixedWidth/> Importieren
        </DropdownItem>

        <DropdownItem onClick={this.onExport}>
          <Icon name="download" fixedWidth title="Beispiel herunterladen" /> Exportieren
        </DropdownItem>

        <DropdownItem onClick={this.onOpenInNewWindow}>
          <Icon name="link" fixedWidth/> In neuem Fenster öffnen
        </DropdownItem>
        <DropdownDivider/>

        <form className="form-inline" onSubmit={e => e.preventDefault()}>
          <Button name="fontSizeSmaller" className="btn-sm fontSizeMenuBtn" onClick={this.onSmallerFontsize}>
            <Icon name="minus" fixedWidth />
          </Button>
          Schriftgröße
          <Button name="fontSizeBigger" className="btn-sm fontSizeMenuBtn" onClick={this.onBiggerFontsize}>
            <Icon name="plus" fixedWidth/>
          </Button>
        </form>

        <DropdownDivider/>

        <DropdownItem onClick={this.onOptions}>
          <Icon name="gear" fixedWidth/> Einstellungen
        </DropdownItem>

      </NavDropdown>
    );
  }
}
