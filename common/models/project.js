import {EventEmitter} from 'events';

import File from './file';
import isString from 'lodash/isString';
import uniqueId from 'lodash/uniqueId';
import { Status } from './status';
import { MessageWithAction } from './messages';
import { Severity  } from './severity';
import { Action } from './actions';

/**
 * Projects need to support multiple modes:
 *  - Default: allows all operations
 *  - Readonly: allows running, etc, but no file changes
 *  - NoSave: allows to running and file changes but not saving those
 *  (- ViewDocument: only view a document with editing but no saving)
 */
export const MODES = {
  'Default': 'Default', /* default mode */
  'Readonly': 'Readonly', /* prevents editing the embed */
  'NoSave': 'NoSave', /* disables saving for the current IDE, e. g. viewing a differen document */
  'ViewDocument': 'ViewDocument' /* allows to view a different document for this embed */
};

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
    this.unnamedTabCounter = 0;

    this.name = data.meta.name || '';

    // save original data
    this.data = data;

    this.tabs = [];
    this.running = false;

    // load from data
    this.fromInitialData(this.data);

    // switch tab to first one
    this.status = new Status();

    this.mode = data.mode || MODES.Default;

    this.isConsistent = true;
  }

  setMessageList(messageList) {
    this.messageList = messageList;
  }

  showMessage(severity, message) {
    if (this.messageList) {
      this.messageList.showMessage(severity, message);
    }
  }

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

  setConsistency(val) {
    this.isConsistent = val;
    this.emitChange();
  }

  getConsistency() {
    return this.isConsistent;
  }

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

  promptFileName() {
    let filename = prompt('Dateiname?');
    let pattern = /([^ !$`&*()+]|(\\[ !$`&*()+]))+/;

    // ToDo: regex filename/filepath
    // ToDo: maybe we should also create the files on the disk...
    if (filename && pattern.test(filename)) {
      return filename;
    } else {
      // ToDo: Message with unallowed filename
      this.showMessage(Severity.Error, 'Ungültiger Pfad bzw. Dateiname!');
      return null;
    }
  }

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
   * Checks if there is already a file with the given name
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

  emitChange() {
    this.emit('change');
  }

  fromInitialData(data) {
    // TODO: add some basic checks maybe
    for (let file in data.code) {
      let fileData = data.code[file];
      if (isString(fileData)) {
        this.addFile(file, fileData);
      } else {
        // handle complicated type
        this.addFile(file, fileData.content);
      }
    }

    // switch to first tab
    if (this.tabs.length > 1) {
      this.switchTab(0);
    }
  }

  toCodeEmbed() {
    // ToDo: return all files and assets as to be saved for server side representation
    //
  }

  toCodeDocument() {
    // ToDo: return all files (altered by an user [not owner]) to be saved
  }

  resetProject() {
    // ToDo: resets the project to the initial state from the server
  }
}
