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

    this.id = id;
    this.label = label;
    this.cssClass = cssClass;
    this.enabled = enabled;
    this.actionCallback = actionCallback;
  }

  setLabel(value) {
    if (this.label !== value) {
      this.label = value;
      this.emit(Action.LABEL, { source: this});
    }
  }

  setTooltip(value) {
    if (this.tooltip !== value) {
      this.tooltip = value;
      this.emit(Action.TOOLTIP, { source: this });
    }
  }

  setClass(value) {
    if (this.cssClass !== value) {
      this.cssClass = value;
      this.emit(Action.CLASS, { source: this });
    }
  }

  setEnabled(value) {
    if (this.enabled !== value) {
      this.enabled = value;
      this.emit(Action.ENABLED, { source: this });
    }
  }

  setChecked(value) {
    if (this.checked !== value) {
      this.checked = value;
      this.emit(Action.CHECKED, { source: this });
    }
  }

  run(event) {
    if (this.actionCallback !== null) {
      return this.actionCallback(event);
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
