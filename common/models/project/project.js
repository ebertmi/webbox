import { EventEmitter } from 'events';

import throttle from 'lodash/throttle';
import clone from 'lodash/clone';

import assert from '../../util/assert';
import { copyText } from '../../util/nbUtil';
import { getFileExtensionByLanguage } from '../../util/languageUtils';
import { loadFromData } from './dataUtils';
import { API } from '../../services';
import { Status } from './status';
import File from './file';
import Test from './test';
import { MessageWithAction } from '../messages';
import { Severity  } from './../severity';
import { Action } from '../actions';
import { MODES, TESTS_KEY } from '../../constants/Embed';
import { SocketConnection, Action as RemoteAction } from '../insights/socketConnection';
import { Insights } from '../insights/insights';
import TabManager from '../tabManager';

/**
 * User Rights limit the operations:
 *  - Default
 *  - Author (modify the codeEmbed directly and also the options)
 *  - ViewDocument
 *
 */
export default class Project extends EventEmitter {
  constructor(projectData) {
    super();
    this.projectData = projectData;

    this.name = this.projectData.embed.meta.name || '';

    // Insights instance, when required
    this.insights = undefined;

    // WebSocket Communication for Logging and Interactions
    this.socketConnection = undefined;
    this.initCommunication();

    // TestCode for auto grading
    this.tests = undefined;

    this.mode = this.projectData.embed.mode || MODES.Default;

    // Setup the message list
    this.messageList = this.projectData.messageList;

    // TabManager instance
    this.tabManager = new TabManager(this.messageList);

    // Load the embed data
    this.fromInitialData(this.projectData.embed);

    // switch tab to first one
    this.status = new Status();
    this.updateUserData();

    // Project state variables
    this.isConsistent = true;
    this.pendingSave = false;

    // Handle throttling and debouncing
    this.saveEmbed = throttle(this.saveEmbed, 800);
  }

  getEmbedId() {
    return this.projectData.embed.id;
  }

  getEmbedDocumentId() {
    this.projectData.embed.document ? this.projectData.embed.document.id : undefined;
  }

  /**
   * Show a message as a box
   */
  showMessage(severity, message) {
    if (this.messageList) {
      this.messageList.showMessage(severity, message);
    }
  }

  /**
   * Hide a specific message from the message list
   */
  hideMessage(obj) {
    if (this.messageList) {
      this.messageList.hideMessage(obj);
    }
  }

  showInsights() {
    // Check rights
    if (this.mode !== MODES.Default) {
      console.warn('Project.showInsights called within wrong mode', this.mode);
      return;
    }

    if (!this.insights) {
      assert(this.socketConnection, 'Passing undefined SocketConnection instance to Insights');

      this.socketConnection.connect();
      this.insights = new Insights(this.socketConnection, this);
    }

    this.tabManager.addTab('insights', { item: this.insights, active: true });
  }

  /**
   * Set internal project consistency. Are there any weird files, etc?
   */
  setConsistency(val) {
    this.isConsistent = val;
    this.emitChange();
  }

  getConsistency() {
    return this.isConsistent;
  }

  /**
   * Handles renaming of files and filters out duplicates and shows a message with possible actions
   */
  onChangedFileName(e) {
    let messageObj;
    let duplicateTab;
    let tab = this.getTabForFileOrNull(e.file);

    // update the syntax highlighting for this tab
    tab.item.autoDetectMode();

    // later on we could do this on the file system maybe and just scan on dir
    let duplicates = this.getFiles().filter(file => file.getName() === e.newName && file !== e.file);

    // Currently, we do handle only one duplicate file and prevent more
    if (duplicates.length > 0) {
      this.setConsistency(false); // inconsisten project state
      // get the tab
      duplicateTab = this.getTabForFileOrNull(duplicates[0]);
      let index = this.tabManager.getTabs().findIndex(tab => tab === duplicateTab);
      let replaceAction = new Action('replace.message.action', 'Ersetzen', null, true, () => {
        // remove old file & tab
        this.tabManager.removeTab(duplicateTab, index);

        this.setConsistency(true);
        this.hideMessage(messageObj); // hide message
      });

      let renameAction = new Action('rename.message.action', 'Umbenennen', null, true, () => {
        // enable renaming mode again
        tab.item.setNameEdtiable(true);

        this.setConsistency(true);
        this.hideMessage(messageObj);
      });

      messageObj = new MessageWithAction('Es existiert bereits eine Datei mit diesem Namen. Was möchten Sie machen?',
        [replaceAction, renameAction]);

      this.showMessage(Severity.Warning, messageObj);
    }
  }

  /**
   * Adds a new file(-tab) to the project. It checks for duplicates and asks the user what to do.
   */
  addFile(name, text, mode, active=true) {
    let file;
    let filename = name;

    if (name == null) {
      filename = 'Unbenannt' + this.tabManager.unnamedTabCounter++ + '.txt';
      file = new File(filename, text, mode);
      file.setNameEdtiable(true); // enable file renaming immediatelly
    } else {
      file = new File(filename, text, mode);
    }

    // filename change handler
    file.on('changedName', this.onChangedFileName.bind(this));

    this.tabManager.addTab('file', { item: file, active: active});
  }

  /**
   * Tries to resolve a tab for the given file or returns null
   */
  getTabForFileOrNull(file) {
    let tab = null;
    let matchingTabs = this.tabManager.getTabs().filter(tab => tab.type === 'file').filter(tab => tab.item === file);
    if (matchingTabs.length === 1) {
      // found a tab (there should be only one now)
      tab = matchingTabs[0];
    } else if (matchingTabs.length > 1) {
      // inconsistent state, should throw an error
      this.showMessage(Severity.Error, 'Inkonsistentes Projekt. Bitte Seite neu laden!');
    }

    return tab;
  }

  /**
   * Try to get the tab for the given name or return null
   */
  getTabForFilenameOrNull(name) {
    let tab = null;
    let matchingTabs = this.tabManager.getTabs().filter(tab => tab.type === 'file').filter(tab => tab.item.getName() === name);
    if (matchingTabs.length === 1) {
      // found a tab
      tab = matchingTabs[0];
    } else if (matchingTabs.length > 1) {
      // inconsistent state, should throw an error
      this.showMessage(Severity.Error, 'Inkonsistentes Projekt. Bitte Seite neu laden!');
      // ToDo: could be interesiting to log this thing?
    }

    return tab;
  }

  /**
   * Returns the tab index for the given file name.
   * @see Project#getTabs
   * @param {string} name The file name to search for (can be also a path)
   * @return {Number|undefined} Returns the index of tab for the file name
   */
  getIndexForFilename(name) {
    let index = this.tabManager.getTabs().findIndex(tab => {
      return tab.type === 'file' && tab.item.getName() === name;
    });

    return index;
  }

  getFileForName(name) {
    let index = this.getIndexForFilename(name);

    if (index < 0 || index == null) {
      return undefined;
    }

    // Return item, that is the file
    return this.tabManager.getTabs()[index].item;
  }

  /**
   * Checks if there is a file with the given name
   * @param {string} name The file name to check
   */
  hasFile(name) {
    return this.getFiles().filter(file => file.getName() === name).length > 0;
  }

  /**
   * Returns all files
   */
  getFiles() {
    return this.tabManager.getTabs()
      .filter(tab => tab.type === 'file')
      .map(tab => tab.item);
  }

  /**
   * Returns the name of the specifiec main file, if any.
   *
   * @returns
   */
  getMainFile() {
    if (this.projectData.embed.meta.mainFile && this.projectData.embed.meta.mainFile !== '') {
      return this.projectData.embed.meta.mainFile;
    }

    return null;
  }

  /**
   * Emits a change event to all registered listeners.
   * Project inherits the EventEmitter interface.
   */
  emitChange() {
    this.emit('change');
  }

  /**
   * Setup the websocket communicaton for sending events and actions to the server
   * @param {String} jwt The jsonwebtoken required for authentification
   * @param {String} url The url for the websocket connection
   */
  initCommunication() {
    this.socketConnection = new SocketConnection(this.projectData.communication);
    this.socketConnection.on('reconnect_failed', this.onReconnectFailed.bind(this));
  }

  onReconnectFailed() {
    this.showMessage(Severity.Warning, 'Derzeit konnte keine Verbindung zum Server hergestellt werden. Sind sie offline?');
  }

  /**
   * Sends a EventLog to the server via the websocket connection.
   * The project sets the context information automatically for all events.
   *
   * We do only send events in default mode
   * @see Project#getContextData
   * @param {EventLog} eventLog Event describes all relevant data
   */
  sendEvent(eventLog) {
    if (this.mode !== MODES.Default) {
      return;
    }

    if (this.socketConnection instanceof SocketConnection) {
      eventLog.setContext(this.getContextData());
      this.socketConnection.sendEvent(eventLog, eventLog);
    } else {
      console.warn('Project.socketConnection not configured. Cannot send events.');
    }
  }

  sendAction(action, useQueue) {
    if (this.socketConnection instanceof SocketConnection) {
      action.setContext(this.getContextData());
      this.socketConnection.sendAction(action, useQueue);
    } else {
      console.warn('Project.socketConnection not configured. Cannot send events.');
    }
  }

  /**
   * Returns an object containing all relevant context information about the current project (code embed)
   *
   * @return {Object} The context data for events and actions containing information about the embed and user
   */
  getContextData() {
    const embedName = this.name;
    const embedId = this.getEmbedId();
    const embedDocument = this.getEmbedDocumentId();
    const embedUser = this.projectData.user && this.projectData.user.email ? this.projectData.user.email : 'anonymous';

    return {
      embedName,
      embedId,
      embedDocument,
      embedUser
    };
  }

  /**
   * Sets the user data associated with the trinket
   */
  updateUserData() {
    this.status.setUsername(this.projectData.user.email || this.projectData.user.username); // display username or email if available
  }

  getUserData() {
    if (this.projectData.user) {
      return this.projectData.user;
    }

    return {
      anonymous: true
    };
  }

  getAssets() {
    return this.projectData.embed.assets != undefined ? this.projectData.embed.assets : [];
  }

  /**
   * Returns true if the project has tests in the assets.
   *
   * @returns
   */
  hasTestCode() {
    return this.tests !== undefined;
  }

  /**
   * Return an instance of the Test model.
   *
   * @returns
   */
  getTestCodeFromData() {
    let assets = this.getAssets();
    let testEntries = assets.filter(elem => elem.type === TESTS_KEY);
    let test;

    if (testEntries.length > 0 && testEntries[0].data && testEntries[0].data !== '') {
      test = new Test(testEntries[0].metadata, testEntries[0].data);
      return test;
    }

    return undefined;
  }

  getTestCode() {
    return this.tests;
  }

  createTestCode(metadata, data) {
    if (metadata == null) {
      metadata = {};
    }

    if (metadata.name == null) {
      metadata.name = `${TESTS_KEY}.${getFileExtensionByLanguage(this.projectData.embed.meta.language)}`;
    }

    if (data == null) {
      data = '';
    }

    this.tests = new Test(metadata, data);
    return this.tests;
  }

  /**
   * Creates a url for sharing this embed
   *
   * @return {String} Absolute URL for this embed for this user
   */
  getSharableLink() {
    const host = window.location.host;
    const protocol = window.location.protocol;
    const viewDocument = this.projectData.embed.document ? `?showDocument=${this.getEmbedDocumentId()}`: '';
    const idOrSlug = this.projectData.embed.slug || this.getEmbedId();

    return `${protocol}//${host}/embed/${idOrSlug}${viewDocument}`;
  }

  getOriginalLink() {
    const host = window.location.host;
    const protocol = window.location.protocol;
    const idOrSlug = this.projectData.embed.slug || this.getEmbedId();

    return `${protocol}//${host}/embed/${idOrSlug}?showOriginal=true`;
  }

  /**
   * Sends the current document to the teacher. The teacher only receives this message if
   * he has activated the sharing.
   */
  shareWithTeacher() {
    let shareMessage;
    let shareAction;
    let closeAction;

    var closeMessage = () => {
      this.messageList.hideMessage(shareMessage);
    };

    shareAction = new Action('share.sharewithteacher.action', 'Abschicken', null, true, () => {
      let message = shareAction.input ? shareAction.input.value : '';
      let remoteAction = new RemoteAction('submission', this.getUserData(), {
        shareableLink: this.getSharableLink(),
        message: message
      },
        res => {
          if (res.error) {
            this.showMessage(Severity.Error, 'Das Senden ist fehlgeschlagen :()');
            console.error(res.error);
          }
        }
      );
      this.sendAction(remoteAction);
      closeMessage();
    });

    shareAction.addInput('text', 'Nachricht...', '');

    closeAction = new Action('close.sharablelink.action', 'Schließen', null, true, () => {
      closeMessage();
    });

    // Create message instance
    shareMessage = new MessageWithAction('Aktuelle Lösung an den Dozenten schicken?', [shareAction, closeAction]);

    // Show it
    this.showMessage(Severity.Warning, shareMessage);
  }

  /**
   * Shows a message with the sharablelink.
   */
  showShareableLink() {
    let copyAction;
    let closeAction;
    let messageObj;
    const link = this.getSharableLink();

    copyAction = new Action('copy.sharablelink.action', 'Kopieren', null, true, () => {
      let succeeded = copyText(null, link);
      if (succeeded) {
        copyAction.setLabel('Kopiert');
      } else {
        this.showMessage(Severity.Warning, 'Link konnte nicht automatisch in die Zwischenablage kopiert werden. Bitte manuell markieren und kopieren.');
      }
    });

    closeAction = new Action('close.sharablelink.action', 'Schließen', null, true, () => {
      this.messageList.hideMessage(messageObj);
    });

    // Create message instance
    messageObj = new MessageWithAction(`Ihr Link: ${link}`, [copyAction, closeAction]);

    // Show it
    this.showMessage(Severity.Ignore, messageObj);
  }

  /**
   * Init the project from the given data object
   */
  fromInitialData(data, ignoreDocument=false) {
    loadFromData(this, data, ignoreDocument);

    // Now check for tests
    this.tests = this.getTestCodeFromData();

    // Update title
    this.setTitle();

    // Update URL to slug, when possible
    this.setLocationToSlug();
  }

  setLocationToSlug() {
    let url = window.location.href;
    const id = this.getEmbedId();
    const slug = this.projectData.embed.slug;

    if (slug == null || slug == '' || slug.length <= 3) {
      return;
    }

    // Check if we need to update
    if (url.includes(id)) {
      url = url.replace(id, slug);
      location.replace(url);
    }
  }

  setTitle() {
    if (this.projectData.embed.meta.name) {
      document.title = `${this.projectData.embed.meta.name} | ${document.title}`;
    }
  }

  canSave() {
    // 1. Check current mode
    if (this.mode !== MODES.Default) {
      this.showMessage(Severity.Warning, 'Sie können dieses Beispiel nicht speichern, da es in der Leseansicht geöffnet wurde.');
      return false;
    }

    let userData = this.getUserData();
    if (userData.isAnonymous === true) {
      this.showMessage(Severity.Warning, 'Sie können dieses Beispiel nicht speichern, da Sie nicht angemeldet sind.');
      return false;
    }

    return true;
  }

  /**
   * Save file changes, but nothing more
   */
  saveEmbed() {
    if (this.canSave()) {
      this._saveEmbed();
    }
  }

  /**
   * Internal save logic
   */
  _saveEmbed() {
    if (this.pendingSave) {
      return; // pending save request
    }


    this.pendingSave = true;
    this.status.setStatusMessage('Speichere...', '', Severity.Ignore);

    const params = {
      id: this.getEmbedId()
    };

    const payload = {
      data: {
        code: this.toCodeDocument()
      }
    };


    // trigger save
    API.embed.saveEmbed(params, payload).then(res => {
      if (res.error) {
        this.status.setStatusMessage('Beim Speichern ist ein Fehler augetreten.', Severity.Error);
      } else {
        this.status.setStatusMessage('Gespeichert.', '', Severity.Info);
        // Update the document, if received any and not set
        if (res.document) {
          this.projectData.embed._document = document;
        }

        window.setTimeout(() => {
          this.status.setStatusMessage('', '', Severity.Ignore);
        }, 1500);
      }
    }).catch(err => {
      this.showMessage(Severity.Error, 'Speichern fehlgeschlagen!');
      console.error(err);
    }).then(() => {
      this.pendingSave = false;
    });
  }

  /**
   * Saves the tests in the assets. This removes all asset entries with the type TESTS_KEY.
   *
   * @returns
   */
  saveTests() {
    // Get data from file
    let file = this.getTestCode();
    if (file == null) {
      // FIXME: this should not happen
      return;
    }

    let testAsset = {
      type: TESTS_KEY,
      data: file.getValue(),
      metadata: file.getMetadata()
    };

    let assets = this.getAssets();
    // Clear all previous test assets
    let idx = assets.findIndex(elem => elem.type === TESTS_KEY);
    while (idx != -1) {
      assets.splice(idx, 1);
      idx = assets.findIndex(elem => elem.type === TESTS_KEY);
    }

    assets.push(testAsset);

    let embed = clone(this.projectData.embed);
    embed.assets = assets;

    this.updateEmbed(embed);
  }

  /**
   * Update the embed attributes. This does not save any file changes.
   *
   * @param {any} embed
   */
  updateEmbed(embed) {
    let params = {
      id: this.getEmbedId()
    };

    let payload = {
      data: embed
    };

    API.embed.updateEmbed(params, payload).then(res => {
      if (res.error) {
        this.showMessage(Severity.Error, 'Beim Aktualisieren ist ein Fehler augetreten.');
      } else {
        // ToDo: Trigger auto reload here for the IDE
        this.showMessage(Severity.Info, 'Erfolgreich aktualisiert.');
      }
    }).catch(err => {
      this.showMessage(Severity.Error, 'Aktualisieren fehlgeschlagen!');
      console.error(err);
    });
  }

  deleteEmbed() {
    const id = this.getEmbedId();
    let messageObj;
    let deleteAction = new Action('delete.delete.action', 'Löschen', '', true, () => {
      API.embed.deleteEmbed({ id: id }).then(res => {
        if (!res.error) {
          // Redirect to main page
          window.location.replace(`${window.location.protocol}//${window.location.host}`);
        } else {
          console.log(res);
          this.messageList.showMessage(Severity.Error, res.error);
        }
      }).catch(err => {
        this.messageList.showMessage(Severity.Error, err);
      });

      // Hide message
      this.messageList.hideMessage(messageObj);
    });

    let cancelAction = new Action('cancel.delete.document', 'Abbrechen', '', true, () => {
      this.messageList.hideMessage(messageObj);
    });

    messageObj = new MessageWithAction('Wollen Sie das Beispiel wirklich löschen? Sie können das Beispiel davor auch exportieren.', [deleteAction, cancelAction]);

    this.messageList.showMessage(Severity.Warning, messageObj);
  }

  toCodeDocument() {
    // Return all files (altered by an user [not owner]) to be saved
    let code = { };
    this.getFiles().map((item) => {
      code[item.getName()] = item.getValue();
    });

    return code;
  }

  /**
   * Resets the project ot the original data loaded from the server.
   */
  reset() {
    // All changes are not saved to the internal embed.code, rather they are stored in the this.tabs->element.item
    // So we can savely replace the current code with the embed.code
    this.fromInitialData(this.projectData.embed, true);
  }
}
