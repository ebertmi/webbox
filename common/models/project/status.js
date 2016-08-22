/**
 * Each IDE as an status bar with messages shown at the bottom
 */
import noop from 'lodash/noop';
import trimEnd from 'lodash/trimEnd';
import {EventEmitter} from 'events';

export function languageToIcon(language) {
  let languageWithoutNumbers = language.replace(/\d+/, '');
  languageWithoutNumbers = trimEnd(languageWithoutNumbers);
  languageWithoutNumbers = languageWithoutNumbers.toLowerCase();

  switch (languageWithoutNumbers) {
    case 'python':
      return 'file_type_python@2x.png';
    case 'c':
      return 'file_type_c@2x.png';
    case 'c++':
      return 'file_type_c++@2x.png';
    case '':
      return 'file_type_java@2x';
    default:
      return undefined;
  }
}

export class StatusBarItem extends EventEmitter {
  constructor(label, icon, tooltip='', color, command=noop, link=false) {
    super();

    this.label = label;
    this.icon = icon;
    this.tooltip = tooltip;
    this.color = color;
    this.command = command;
    this.link = link;
  }

  setLabel(label) {
    this.label = label;
    this.emit('change');
  }

  setIcon(icon) {
    this.icon = icon;
    this.emit('change');
  }

  setTooltip(tooltip) {
    this.tooltip = tooltip;
    this.emit('change');
  }

  setColor(color) {
    this.color = color;
    this.emit('change');
  }

  setCommand(command) {
    this.command = command;
    this.emit('change');
  }

  setLink(link) {
    this.link = link;
    this.emit('change');
  }
}

export const StatusBarAlignment = {
  Left: 'left',
  Right: 'right'
};

export const StatusBarColor = {
  Danger: 'danger',
  Warning: 'warning',
  Info: 'info',
  Success: 'success',
  Default: ''
};

export class StatusBarRegistry extends EventEmitter {
  constructor() {
    super();

    this._items = [];
  }

  getItems() {
    return this._items;
  }

  clear() {
    this._items = [];
    this.emit('change');
  }

  /**
   * A item to display on the status bar.
   *
   * @param {any} item
   */
  registerStatusbarItem(statusbarItem, alignment, priority=0) {
    this._items.push({
      item: statusbarItem,
      alignment: alignment,
      priority: priority
    });

    this.emit('change');
  }
}
