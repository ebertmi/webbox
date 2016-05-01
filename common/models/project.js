import {EventEmitter} from 'events';

import File from './file';
import isString from 'lodash/isString';
import { Status } from './status';

export default class Project extends EventEmitter {
  constructor(data) {
    super();

    this.name = data.meta.name || '';

    // save original data
    this.data = data;

    this.tabs = [];
    this.running = false;

    // load from data
    this.fromInitialData(this.data);

    // switch tab to first one
    this.status = new Status();
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
        active: false
      }) - 1;
    }

    if (active) {
      this.switchTab(index);
    } else {
      this.emitChange();
    }
  }

  getTabs() {
    return this.tabs;
  }

  closeTab(index) {
    let tab = this.tabs.splice(index, 1)[0];

    if (!tab) {
      return;
    }

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

  addFile(name, text, mode, active=true) {
    if (this.hasFile(name)) {
      this.status.setStatusMessage('Datei bereits vorhanden. Ersetzen?', 'Achtung', 'danger');
    }

    let file = new File(name, text, mode);

    this.addTab('file', { item: file, active: active});
  }

  hasFile(name) {
    return this.tabs.filter(tab => tab.type === 'file').filter(tab => tab.item.getName() === name).length > 0;
  }

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
