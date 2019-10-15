import React from 'react';
import set from 'lodash/set';

import optionManager from '../../models/options';

import Modal from 'react-modal';
//import Modal from '../Modal';
import ModalBody from '../ModalBody';
import ModalFooter from '../ModalFooter';
import ModalHeader from '../ModalHeader';

import Icon from '../Icon';
import { copyText } from '../../util/nbUtil';
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
    this.toggleShareLinkModal = this.toggleShareLinkModal.bind(this);
    this.onCopyShareLink = this.onCopyShareLink.bind(this);
    this.focusShareLink = this.focusShareLink.bind(this);

    this.ensureHiddenImportInput();

    this.state = {
      showShareLinkModal: false,
      shareLink: '',
      shareLinkModalCopyButtonText: 'Kopieren'
    };
  }

  /*componentWillMount() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    this.input = input;
  }*/

  componentDidMount() {
    this.input.addEventListener('change', this.onImport);
  }

  /**
   * Only rerender on a new project
   */
  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.project != nextProps.project) {
      return true;
    }

    if (this.state.showShareLinkModal != nextState.showShareLinkModal) {
      return true;
    }

    if (this.state.shareLink != nextState.shareLink) {
      return true;
    }

    if (this.state.shareLinkModalCopyButtonText != nextState.shareLinkModalCopyButtonText) {
      return true;
    }

    return false;
  }

  onCopyShareLink(e) {
    e.preventDefault();

    let succeeded = copyText(null, this.state.shareLink);

    if (succeeded) {
      this.setState({
        shareLinkModalCopyButtonText: 'Kopiert!'
      });
    } else {
      this.setState({
        shareLinkModalCopyButtonText: 'Hat leider nicht funktioniert.'
      });
    }

    this.focusShareLink();
  }

  onModalClose() {
    this.setState({
      showShareLinkModal: false
    });
  }

  onResetProject(e) {
    e.preventDefault();

    this.props.project.reset();
  }

  /**
   * Handler for creating new files. Delegates the file creation to the project model associated
   * with this Menu.
   *
   * @param {event} e Event object
   * @returns {undefined}
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
    } else if (files.length > 1) {
      const zipFile = generateZip(name, files);
      saveZipAsFile(name, zipFile);
    } else {
      // download as single file
      saveTextAsFile(name, files[0]);
    }
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
    this.setState({
      shareLink: this.props.project.getSharableLink(),
      showShareLinkModal: true
    });
  }

  onOpenInNewWindow(e) {
    e.preventDefault();
    let link = this.props.project.getSharableLink();
    window.open(link, '_blank');
  }

  changeFontSize(delta) {
    let fontSize = optionManager.getOptions().fontSize;
    fontSize += delta;

    let options = set({}, 'fontSize', fontSize);
    optionManager.setOptions(options);
  }

  toggleShareLinkModal() {
    this.setState({
      showShareLinkModal: !this.state.showShareLinkModal
    });
  }

  focusShareLink() {
    if (this.refs.sharelinkinput) {
      this.refs.sharelinkinput.select();
    }
  }

  /**
   * Creates an hidden input field that is used for importing data.
   * @returns {void}
   * @memberof Menu
   */
  ensureHiddenImportInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    this.input = input;
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
        <Modal
          isOpen={this.state.showShareLinkModal}
          onRequestClose={this.toggleShareLinkModal}
          shouldCloseOnOverlayClick={true}
          className={{
            base: 'modal-dialog',
            afterOpen: 'show',
            beforeClose: ''
          }}

          overlayClassName={{
            base: 'modal-backdrop',
            afterOpen: 'show',
            beforeClose: ''
          }}
        >
          <div className="modal-content">
            <ModalHeader toggle={this.toggleShareLinkModal}>Teilbarer Link</ModalHeader>
            <ModalBody>
              <p>Unter folgendem Link kann das Beispiel inklusive Ihrer Änderungen aufgerufen werden.</p>
              <input ref="sharelinkinput" className="form-control" type="text" readOnly value={this.state.shareLink} onClick={this.focusShareLink} />
              <small>Falls Sie iOS verwenden, klicken Sie bitte auf den Link und nutzen Sie die Standardfunktionen zum kopieren.</small>
            </ModalBody>
            <ModalFooter>
              <button className="btn btn-primary" onClick={this.onCopyShareLink}>{this.state.shareLinkModalCopyButtonText}</button>{' '}
              <button className="btn btn-secondary" onClick={this.toggleShareLinkModal}>Schließen</button>
            </ModalFooter>
          </div>
        </Modal>

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
