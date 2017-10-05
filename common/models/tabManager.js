import uniqueId from 'lodash/uniqueId';
import { EventEmitter } from 'events';

import { Severity  } from './severity';
import { Action } from './actions';
import { MessageWithAction } from './messages';

export default class TabManager extends EventEmitter {
  constructor(messageList) {
    super();
    this.tabs = [];
    this.unnamedTabCounter = 0;

    this.messageList = messageList;

    // solutions to allow multiple events listeners
    this.setMaxListeners(0);
  }

  /**
   * Clear all has changes flags of the file tabs, should be called
   * after an successful save.
   * @returns {undefined}
   * 
   * @memberOf TabManager
   */
  clearFileChanges() {
    // Get all file tabs and clear the internal changes, indicator o.O?
    let fileTabs = this.tabs.filter(tab => tab.type === 'file');
    fileTabs.forEach(tab => {
      tab.item.clearChanges();
    });
  }

  /**
   * Return all tabs of the project
   */
  getTabs() {
    return this.tabs;
  }

  /**
   * Clears all tabs. Call with care!
   */
  clear() {
    this.tabs = [];
    this.emit('change');
  }

  addTab(type, { item, active=true, callback } = {}) {
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

  getTabByUniqueId(id) {
    let index = this.tabs.findIndex(tab => {
      return tab.uniqueId = id;
    });

    return index >= 0 ? this.tabs[index] : undefined;
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
      this.closeFileTab(tab, index);
    } else {
      // handle other tab types (e.g. stats that the user can reopen)
      this.removeTab(tab, index);
    }
  }

  closeFileTab(tab, index) {
    // ask user what todo if he wants to close/delete a file tab
    let messageObj;
    let deleteAction = new Action('delete.message.action', 'Löschen', null, true, () => {
      this.removeTab(tab, index);

      // cleanup
      tab.item.dispose();

      this.messageList.hideMessage(messageObj); // hide message
    });

    let cancelAction = new Action('cancel.message.action', 'Abbrechen', null, true, () => {
      this.messageList.hideMessage(messageObj);
    });

    messageObj = new MessageWithAction('Wollen Sie diese Datei wirklich löschen?',
      [deleteAction, cancelAction]);

    this.messageList.showMessage(Severity.Warning, messageObj);
  }

  closeTabByType(type) {
    let tabs = this.tabs.filter(tab => tab.type === type);

    tabs.forEach(tab => {
      // Get index
      let index = this.tabs.findIndex(t => {
        return t.uniqueId === tab.uniqueId;
      });

      this.removeTab(tab, index);
    });
  }

  hideTabsByType(type) {
    let tabs = this.tabs.filter(tab => tab.type === type);

    tabs.forEach(tab => {
      if (tab) {
        tab.active = false;
        this.emitChange();
      }
    });

    this.emitChange();
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

    this.emit('tabremoved', tab);
  }

  /**
   * Switch to the tab with the given index.
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

  /**
   * Toggles the tabs active state
   *
   * @param {any} index
   */
  toggleTab(index) {
    let tab = this.tabs[index];

    if (tab) {
      tab.active = !tab.active;
      this.emitChange();
    }
  }

  /**
   * Emits a change event to all registered listeners.
   */
  emitChange() {
    this.emit('change');
  }
}