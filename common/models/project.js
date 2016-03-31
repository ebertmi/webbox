import {EventEmitter} from 'events';

import File from './file';

// maybe save orignal file(names), so reset works?

export default class Project extends EventEmitter {
  constructor(name) {
    super();

    this.name = name;

    this.tabs = [];
    this.running = false;
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

  addFile(name, text, mode) {
    let file = new File(name, text, mode);

    this.addTab('file', { item: file });
  }

  getFiles() {
    return this.tabs
      .filter(tab => tab.type === 'file')
      .map(tab => tab.item);
  }

  emitChange() {
    this.emit('change');
  }
}
