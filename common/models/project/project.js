import { EventEmitter } from 'events';

import clone from 'lodash/clone';
import capitalize from 'lodash/capitalize';
import isString from 'lodash/isString';
import throttle from 'lodash/throttle';

import assert from '../../util/assert';
import languages from './languages';
import { copyText } from '../../util/nbUtil';
import { RemoteActions } from '../../constants/Embed';
import { getFileExtensionByLanguage } from '../../util/languageUtils';
import { loadFromData } from './dataUtils';
import { API } from '../../services';
import { StatusBarRegistry, StatusBarAlignment, StatusBarItem, StatusBarColor } from './status';
import File from './file';
import Test from './test';
import { MessageWithAction } from '../messages';
import { Severity  } from './../severity';
import { Action } from '../actions';
import { MODES, TESTS_KEY } from '../../constants/Embed';
import { RemoteDispatcher, Action as RemoteAction } from '../insights/remoteDispatcher';
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

    // Check the project/language configuration
    this.checkProjectConfiguration();

    this.name = this.projectData.embed.meta.name || '';

    // Insights instance, when required
    this.insights = undefined;

    // WebSocket Communication for Logging and Interactions
    this.socketConnection = undefined;
    this.initCommunication();

    // TestCode for auto grading
    this.tests = undefined;

    // Set the Project Mode. (E.g. Run Mode, ViewDocument, etc...)
    this.mode = this.projectData.embed._mode || MODES.Default;

    // Setup the message list
    this.messageList = this.projectData.messageList;

    // TabManager instance
    this.tabManager = new TabManager(this.messageList);

    // The StatusBarRegistry holds all items of the status bar
    this.statusBarRegistry = new StatusBarRegistry();

    // The Status object holds references to important status bar items, e.g. message
    this.status = {
      message: null,
      hasChanges: null
    };

    // Load the embed data
    this.fromInitialData(this.projectData.embed);

    // Create the initial status bar items
    this.createStatusBarItems();

    // Project state variables
    this.isConsistent = true;
    this.pendingSave = false;
    this.hasUnsavedChanges = false; // Flag if the project has unsaved changes!

    // Handle throttling and debouncing
    this.saveEmbed = throttle(this.saveEmbed, 800);
  }

  /**
   * Tries to set the language configuration for the embed.
   */
  checkProjectConfiguration() {
    if (isString(this.projectData.embed.meta.language)) {
      this.config = languages[this.projectData.embed.meta.language];
    } else {
      this.config = this.projectData.embed.meta.language;
    }
  }

  /**
   * Change the status bar message
   *
   * @param {String} msg - The message to display
   * @param {String} [icon=null] - Additional icon class or icon path
   * @param {any} [color=StatusBarColor.Default] - Any {StatusBarColor}
   * @param {Function} [command=null] - Optional command that is executed when the user clicks on the message
   */
  setStatusMessage(msg, icon=null, color=StatusBarColor.Default, command=null) {
    this.status.message.setLabel(msg);

    if (icon != null) {
      this.status.message.setIcon(icon);
    }

    if (color != null) {
      this.status.message.setColor(color);
    }

    if (command != null) {
      this.status.message.setCommand(command);
    }
  }

  /**
   * Create the status bar items and add them to the status bar registry
   */
  createStatusBarItems() {
    // Clear previous entries, may be required if we reset a project
    this.statusBarRegistry.clear();

    // Left side:
    // Language information
    //const languageIconName = languageToIcon(this.config.displayName);
    const sbrLangInfo = new StatusBarItem(this.config.displayName, null, 'Verwendete Sprachversion');
    this.statusBarRegistry.registerStatusbarItem(sbrLangInfo, StatusBarAlignment.Left, 100);

    // Embed Type
    const sbrEmbedTypeInfo = new StatusBarItem(capitalize(this.projectData.embed.meta.embedType), 'terminal', 'Ausführmodus (Umgebung)');
    this.statusBarRegistry.registerStatusbarItem(sbrEmbedTypeInfo, StatusBarAlignment.Left, 90);

    // user name
    const name = this.projectData.user.email || this.projectData.user.username;
    const sbrUserInfo =  new StatusBarItem(name, 'user', 'Benutzername');
    this.statusBarRegistry.registerStatusbarItem(sbrUserInfo, StatusBarAlignment.Left, 80);

    // conditional log off or log on button
    let logOnOffUrl;
    let logOnOffLabel;
    if (this.projectData.user.isAnonymous) {
      let url = window.location.href;
      logOnOffUrl = `/login?next=${encodeURI(url)}`;
      logOnOffLabel = 'Anmelden';
    } else {
      logOnOffUrl = '/logout';
      logOnOffLabel = 'Abmelden';
    }

    const sbrLogOnOff = new StatusBarItem(logOnOffLabel, null, 'An/Abmelden', null, null, logOnOffUrl);
    this.statusBarRegistry.registerStatusbarItem(sbrLogOnOff, StatusBarAlignment.Left, 70);

    // The message
    const statusMessage = new StatusBarItem('', null, 'Aktueller Status');
    this.status.message = statusMessage;
    this.statusBarRegistry.registerStatusbarItem(statusMessage, StatusBarAlignment.Left, 0);

    // Right side:

    // Has Changes
    const hasChanges = new StatusBarItem('', null);
    this.status.hasChanges = hasChanges;
    this.statusBarRegistry.registerStatusbarItem(hasChanges, StatusBarAlignment.Right, 200);

    // Zum original
    const sbrToOriginal =  new StatusBarItem('Zum Original', null, 'Zeigt das unveränderte Original an', null, (e) => {
      if (e && e.preventDefault()) {
        e.preventDefault();
      }

      const link = this.getOriginalLink();
      window.open(link, '_blank');
    }, '#');
    this.statusBarRegistry.registerStatusbarItem(sbrToOriginal, StatusBarAlignment.Right, 100);

    // Zur Startseite
    const sbrToStart = new StatusBarItem('Startseite', null, 'Zur Startseite', null, (e) => {
      if (e && e.preventDefault()) {
        e.preventDefault();
      }

      window.open('/', '_blank');
    }, '#');
    this.statusBarRegistry.registerStatusbarItem(sbrToStart, StatusBarAlignment.Right, 0);
  }

  /**
   * Get the embed id of the project
   *
   * @returns {String} id
   */
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

  /**
   * Displays the insights in a tab
   *
   * @returns
   */
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

        this.setUnsavedChanges(true);
      });

      let renameAction = new Action('rename.message.action', 'Umbenennen', null, true, () => {
        // enable renaming mode again
        tab.item.setNameEdtiable(true);

        this.setConsistency(true);
        this.hideMessage(messageObj);
        this.setUnsavedChanges(true);
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
    file.on('hasChangesUpdate', () => {
      if (file.hasChanges) {
        this.setUnsavedChanges(true);
      }
    });

    this.setUnsavedChanges(true);

    this.tabManager.addTab('file', { item: file, active: active});
  }

  setUnsavedChanges(val) {
    // Prevent Changes display in RunMode, etc.
    if (this.canSave(false) === false) {
      val = false;
    }

    this.hasUnsavedChanges = val;
    let label = '';

    if (this.hasUnsavedChanges === false) {
      this.tabManager.clearFileChanges();
    } else {
      label = 'Ungespeicherte Änderungen';
    }

    if (this.status.hasChanges != null) {
      this.status.hasChanges.setLabel(label);
    }

    this.emit('change');
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
    this.socketConnection = new RemoteDispatcher(this.projectData.communication);
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

    if (this.socketConnection instanceof RemoteDispatcher) {
      eventLog.setContext(this.getContextData());
      this.socketConnection.sendEvent(eventLog, eventLog);
    } else {
      console.warn('Project.socketConnection not configured. Cannot send events.');
    }
  }

  /**
   * Send a action to the server with the context data derived from the project
   *
   * @param {any} action
   * @param {any} useQueue
   */
  sendAction(action, useQueue) {
    if (this.socketConnection instanceof RemoteDispatcher) {
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
   * Returns the available user data or an anonymous user
   *
   * @returns
   */
  getUserData() {
    if (this.projectData.user) {
      return this.projectData.user;
    }

    return {
      anonymous: true
    };
  }

  /**
   * Returns the assets of the project
   *
   * @returns {Array} of assets (objects)
   */
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

  /**
   * Create a new Test object for the project for the current language
   *
   * @param {any} metadata
   * @param {any} data
   * @returns
   */
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

  /**
   * Creates a link pointing to the original version of the embed
   *
   * @returns str with the full URL
   */
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
      let remoteAction = new RemoteAction(RemoteActions.Submission, this.getUserData(), {
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
    this.showMessage(Severity.Info, messageObj);
  }


  /**
   * Init the project from the given data object
   *
   * @param {Object} data -  The Embed
   * @param {boolean} [ignoreDocument=false] - If true any code document will be ignored
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

  /**
   * Update the URL from the embed id to the slug if available
   *
   * @returns
   */
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

  /**
   * Update the browser/document title with the project name
   */
  setTitle() {
    if (this.projectData.embed.meta.name) {
      document.title = `${this.projectData.embed.meta.name} | ${document.title}`;
    }
  }

  canSave(showWarnings=true) {
    // 1. Check current mode
    if (this.mode !== MODES.Default) {
      if (showWarnings) {
        this.showMessage(Severity.Warning, 'Sie können dieses Beispiel nicht speichern, da es in der Leseansicht geöffnet wurde.');
      }
      return false;
    }

    let userData = this.getUserData();
    if (userData.isAnonymous === true) {
      if (showWarnings) {
        this.showMessage(Severity.Warning, 'Sie können dieses Beispiel nicht speichern, da Sie nicht angemeldet sind.');
      }
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
    this.setStatusMessage('Speichere...', null, StatusBarColor.Default);

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
        this.setStatusMessage('Beim Speichern ist ein Fehler augetreten.', null, StatusBarColor.Danger);
      } else {
        // Reset the unsaved changes indicators
        this.setUnsavedChanges(false);

        this.setStatusMessage('Gespeichert.', null, StatusBarColor.Success);
        // Update the document, if received any and not set
        if (res.document) {
          this.projectData.embed._document = document;
        }

        window.setTimeout(() => {
          this.setStatusMessage('');
        }, 2000);
      }
    }).catch(err => {
      this.showMessage(Severity.Error, 'Speichern fehlgeschlagen!', null, StatusBarColor.Danger);
      this.setStatusMessage('', null, StatusBarColor.Default);
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
