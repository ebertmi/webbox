import { EventEmitter } from 'events';

import isString from 'lodash/isString';
import uniqueId from 'lodash/uniqueId';
import throttle from 'lodash/throttle';

import assert from '../util/assert';
import { copyText } from '../util/nbUtil';
import { API } from '../services';
import { Status } from './status';
import File from './file';
import { MessageWithAction } from './messages';
import { Severity  } from './severity';
import { Action } from './actions';
import { MODES } from '../constants/Embed';
import { SocketConnection, Action as RemoteAction } from './socketConnection';
import { Insights } from './insights';

/**
 * User Rights limit the operations:
 *  - Default
 *  - Author (modify the codeEmbed directly and also the options)
 *  - ViewDocument
 *
 */
export default class Project extends EventEmitter {
  constructor(data) {
    super();
    this.name = data.meta.name || '';
    // save original data
    this.data = data;

    // Insights instance, when required
    this.insights = undefined;
    this.socketConnection = undefined;

    this.mode = data.mode || MODES.Default;
    this._userData = undefined; // we store here user data later

    this.unnamedTabCounter = 0;
    this.tabs = [];
    this.running = false;

    // load from data
    this.fromInitialData(this.data);

    // switch tab to first one
    this.status = new Status();

    // Project state variables
    this.isConsistent = true;
    this.pendingSave = false;

    // Handle throttling and debouncing
    this.saveEmbed = throttle(this._saveEmbed, 800);
  }

  /**
   * Setup our project wide message system (notifications)
   */
  setMessageList(messageList) {
    this.messageList = messageList;
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

  // callback is called when tab is closed
  addTab(type, {item, active=true, callback}={}) {
    let index = this.tabs.findIndex(tab => {
      return tab.type === type && tab.item === item;
    });

    if (index < 0) {
      index = this.tabs.push({
        type,
        item,
        callback,
        active: false,
        uniqueId: uniqueId('tab-')
      }) - 1;
    }

    if (active) {
      this.switchTab(index);
    } else {
      this.emitChange();
    }

    return index;
  }

  /**
   * Return all tabs of the project
   */
  getTabs() {
    return this.tabs;
  }

  /**
   * Closing a tab, basically removes currently the tab/file from the project
   * Maybe we should prevent the closing of files until we have an file explorer
   * or add an message with actions
   */
  closeTab(index) {
    // get tab
    // change this, because this deletes the tab from the list already
    let tab = this.tabs[index];

    if (!tab) {
      return;
    }

    if (tab.type === 'file') {
      // ask user what todo if he wants to close/delete a file tab
      let messageObj;
      let deleteAction = new Action('delete.message.action', 'Löschen', null, true, () => {
        this.removeTab(tab, index);

        // cleanup
        tab.item.dispose();

        this.hideMessage(messageObj); // hide message
      });

      let cancelAction = new Action('cancel.message.action', 'Abbrechen', null, true, () => {
        this.hideMessage(messageObj);
      });

      messageObj = new MessageWithAction('Wollen Sie diese Datei wirklich löschen?',
        [deleteAction, cancelAction]);

      this.showMessage(Severity.Warning, messageObj);
    } else {
      // handle other tab types (e.g. stats that the user can reopen)
      this.removeTab(tab, index);
    }
  }

  /**
   * Removes a tab from the internal tabs array. When deleted it's gone!
   */
  removeTab(tab, index) {
    // try to remove from list
    this.tabs.splice(index, 1);

    if (!tab) {
      return;
    }

    // handle other tab types (e.g. stats that the user can reopen)
    if (tab.callback) {
      tab.callback();
    }

    if (tab.active && this.tabs.length && !this.tabs.some(tab => tab.active)) {
      this.switchTab(Math.min(this.tabs.length - 1, index));
    } else {
      this.emitChange();
    }
  }

  /**
   * ext install addDocComments
   *
   * @param {Number} index The index of the tab, that shuld be focused/activated
   */
  switchTab(index) {
    let tab = this.tabs[index];

    if (tab) {
      this.tabs.forEach(tab => tab.active = false);
      tab.active = true;
      this.emitChange();
    }
  }

  toggleTab(index) {
    let tab = this.tabs[index];

    if (tab) {
      tab.active = !tab.active;
      this.emitChange();
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

    this.addTab('insights', { item: this.insights, active: true });
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
      let index = this.tabs.findIndex(tab => tab === duplicateTab);
      let replaceAction = new Action('replace.message.action', 'Ersetzen', null, true, () => {
        // remove old file & tab
        this.removeTab(duplicateTab, index);

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
      filename = 'Unbenannt' + this.unnamedTabCounter++ + '.txt';
      file = new File(filename, text, mode);
      file.setNameEdtiable(true); // enable file renaming immediatelly
    } else {
      file = new File(filename, text, mode);
    }

    // filename change handler
    file.on('changedName', this.onChangedFileName.bind(this));

    this.addTab('file', { item: file, active: active});
  }

  /**
   * Tries to resolve a tab for the given file or returns null
   */
  getTabForFileOrNull(file) {
    let tab = null;
    let matchingTabs = this.tabs.filter(tab => tab.type === 'file').filter(tab => tab.item === file);
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
    let matchingTabs = this.tabs.filter(tab => tab.type === 'file').filter(tab => tab.item.getName() === name);
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
    let index = this.tabs.findIndex(tab => {
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
    return this.getTabs()[index].item;
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
    return this.tabs
      .filter(tab => tab.type === 'file')
      .map(tab => tab.item);
  }

  /**
   * Returns the name of the specifiec main file, if any.
   *
   * @returns
   */
  getMainFile() {
    if (this.data.meta.mainFile && this.data.meta.mainFile !== '') {
      return this.data.meta.mainFile;
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
  setCommunicationData(jwt, url) {
    this.socketConnection = new SocketConnection(jwt, url);
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
    const embedId = this.data.id;
    const embedDocument = this.data.document ? this.data.document.id : undefined;
    const embedUser = this._userData && this._userData.email ? this._userData.email : 'anonymous';

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
  setUserData(data) {
    this._userData = data;
    this.status.setUsername(data.email || data.username); // display username or email if available
  }

  getUserData() {
    if (this._userData) {
      return this._userData;
    }

    return {
      anonymous: true
    };
  }

  /**
   * Return true if the current user can save the embed
   */
  canUserSave() {
    if (!this._userData) {
      return false;
    }

    switch(this._userData.mode) {
      case MODES.RunMode:
      case MODES.Readonly:
      case MODES.NoSave:
      case MODES.Unknown:
        return false;
      default:
        return true;
    }
  }


  /**
   * Creates a url for sharing this embed
   *
   * @return {String} Absolute URL for this embed for this user
   */
  getSharableLink() {
    const host = window.location.host;
    const protocol = window.location.protocol;
    const viewDocument = this.data.document ? `?showDocument=${this.data.document.id}`: '';
    const idOrSlug = this.data.slug || this.data.id;

    return `${protocol}//${host}/embed/${idOrSlug}${viewDocument}`;
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
  fromInitialData(data) {
    let code;

    // Check if there is already a document on the data and try to load from there
    if (data._document && data._document.code) {
      code = data._document.code;
    } else {
      code = data.code;
    }

    for (let file in code) {
      let fileData = code[file];
      if (isString(fileData)) {
        this.addFile(file, fileData);
      } else {
        // handle complicated type
        this.addFile(file, fileData.content);
      }
    }

    let index = 0;
    let mainFile = data.meta.mainFile || 'main.py'; // ToDo: change this
    // switch to specified mainFile
    if (mainFile) {
      index = this.getIndexForFilename(mainFile);

      index = index > -1 ? index : 0;
    }

    // switch to first tab
    if (this.tabs.length > 1) {
      this.switchTab(index);
    }

    // Update title
    this.setTitle();

    // Update URL to slug, when possible
    this.setLocationToSlug();
  }

  setLocationToSlug() {
    let url = window.location.href;
    const id = this.data.id;
    const slug = this.data.slug;

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
    if (this.data.meta.name) {
      document.title = `${this.data.meta.name} | ${document.title}`;
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
      this.showMessage(Severity.Warning, 'Sie können dieses Beispiel nicht speichern, da sie nicht angemeldet sind.');
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
      id: this.data.id
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
          this.data._document = document;
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
   * Update the embed attributes. This does not save any file changes.
   *
   * @param {any} embed
   */
  updateEmbed(embed) {
    let params = {
      id: this.data.id
    };

    let payload = {
      data: embed
    };

    API.embed.updateEmbed(params, payload).then(res => {
      if (res.error) {
        this.showMessage(Severity.Error, 'Beim Aktualisieren ist ein Fehler augetreten.');
      } else {
        this.showMessage(Severity.Info, 'Die Eigenschaften wurden erfolgreich aktualisiert.');
      }
    }).catch(err => {
      this.showMessage(Severity.Error, 'Aktualisieren fehlgeschlagen!');
      console.error(err);
    });
  }

  deleteEmbed() {
    const id = this.data.id;
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

  //resetProject() {
    // ToDo: resets the project to the initial state from the server
  //}
}
