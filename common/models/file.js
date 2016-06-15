import Ace, {EditSession, UndoManager} from 'ace';

const modelist = Ace.require('ace/ext/modelist');

export default class File extends EditSession {
  constructor(name, text='', mode=modelist.getModeForPath(name).mode) {
    super(text, mode);
    this.setUndoManager(new UndoManager);
    this._name = name;
    this._isNameEditable = false;
    this._nameChanged = false;
  }

  autoDetectMode() {
    let mode = modelist.getModeForPath(this._name).mode;
    super.setMode(mode);
  }

  isNameEditable() {
    return this._isNameEditable;
  }

  setNameEdtiable(val) {
    if (val !== undefined && (val === true || val === false)) {
      this._isNameEditable = val;
      this._emit('changeNameEditable');

      // trigger changedName event, when name is different after leaving
      // name edit mode
      if (this._isNameEditable === false && this._oldName !== undefined && this._name !== this._oldName) {
        this._emit('changedName', {
          newName: this._name,
          oldName: this._oldName,
          file: this
        });
      } else {
        this._oldName = undefined;
      }
    } else {
      throw new Error('File.setNameEdtiable: argument "val" must be bool');
    }
  }

  /**
   * Escapes invalid path characters
   */
  escapeName(str) {
    if (!str) {
      return str;
    }

    return str.replace(/\\|[!$`&*()+]/, '');
  }

  setName(name) {
    let escapedName = this.escapeName(name);

    this._oldName = this._name;
    this._name = escapedName;

    this._emit('changeName', {
      newName: this._name,
      oldName: this._oldName
    });
  }

  getName() {
    return this._name;
  }

  dispose() {
    this.removeAllListeners("changeName");
    this.removeAllListeners("changedName");
    this.removeAllListeners("changeNameEditable");
  }
}

File.prototype.addListener = File.prototype.addEventListener;
