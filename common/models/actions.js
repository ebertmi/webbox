import { EventEmitter } from 'events';
import Promise from 'bluebird';

export function isAction(thing) {
  if (!thing) {
    return false;
  } else if (thing instanceof Action) {
    return true;
  } else if (typeof thing.id !== 'string') {
    return false;
  } else if (typeof thing.label !== 'string') {
    return false;
  } else if (typeof thing.class !== 'string') {
    return false;
  } else if (typeof thing.enabled !== 'boolean') {
    return false;
  } else if (typeof thing.checked !== 'boolean') {
    return false;
  } else if (typeof thing.run !== 'function') {
    return false;
  } else {
    return true;
  }
}

export class Action extends EventEmitter {
  constructor(id, label='', cssClass='', enabled=true, actionCallback=null) {
    super();

    this._id = id;
    this._label = label;
    this._cssClass = cssClass;
    this._enabled = enabled;
    this._actionCallback = actionCallback;
  }

  setLabel(value) {
    if (this._label !== value) {
      this._label = value;
      this.emit(Action.LABEL, { source: this});
    }
  }

  setTooltip(value) {
    if (this._tooltip !== value) {
      this._tooltip = value;
      this.emit(Action.TOOLTIP, { source: this });
    }
  }

  setClass(value) {
    if (this._cssClass !== value) {
      this._cssClass = value;
      this.emit(Action.CLASS, { source: this });
    }
  }

  setEnabled(value) {
    if (this._enabled !== value) {
      this._enabled = value;
      this.emit(Action.ENABLED, { source: this });
    }
  }

  setChecked(value) {
    if (this._checked !== value) {
      this._checked = value;
      this.emit(Action.CHECKED, { source: this });
    }
  }

  run(event) {
    if (this._actionCallback !== null) {
      return this._actionCallback(event);
    } else {
      return Promise.return(true);
    }
  }

  dispose() {
    // we might need some handler cleanup later on
  }
}

Action.LABEL = 'label';
Action.TOOLTIP = 'tooltip';
Action.CLASS = 'class';
Action.ENABLED = 'enabled';
Action.CHECKED = 'checked';
