import { EventEmitter } from 'events';
import { createModel } from '../../util/monacoUtils';

export default class File extends EventEmitter {
  constructor(name, value, language) {
    super();

    this._name = name;
    this._isNameEditable = false;
    this._nameChanged = false;
    this.hasChanges = true; // a new file is a change, basically

    this.model = createModel(name, value, language);

    // Binding
    this.onDocumentChange = this.onDocumentChange.bind(this);
    this.model.onDidChangeContent(this.onDocumentChange);
  }

  setValue(value) {
    this.model.setValue(value);
  }

  getValue() {
    return this.model.getValue();
  }

  removeListener() {}
  
  getAnnotations() {
      console.log(this.model.getAllDecorations());
      return this.model.getAllDecorations();
  }

  /**
   * Set the hasChanges flag to true and notify all listeners if it has changes.
   *
   * @returns
   *
   * @memberOf File
   */
  onDocumentChange() {
    // Skip if document is already dirty
    if (this.hasChanges === true) {
      return;
    }

    this.hasChanges = true;
    this.emit('hasChangesUpdate');
  }

  clearChanges() {
    this.hasChanges = false;
    this.emit('hasChangesUpdate');
  }

  autoDetectMode() {
    //let mode = modelist.getModeForPath(this._name).mode;
    monaco.editor.setModelLanguage(this.model);
  }

  isNameEditable() {
    return this._isNameEditable;
  }

  setNameEdtiable(val) {
    if (val !== undefined && (val === true || val === false)) {
      this._isNameEditable = val;
      this.emit('changeNameEditable');

      // trigger changedName event, when name is different after leaving
      // name edit mode
      if (this._isNameEditable === false && this._oldName !== undefined && this._name !== this._oldName) {
        this.emit('changedName', {
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

    this.emit('changeName', {
      newName: this._name,
      oldName: this._oldName
    });
  }

  getName() {
    return this._name;
  }

  updateAnnotations(annotations) {
    console.info('new annotations', annotations);
    //this.setAnnotations(annotations);
    this.emit('hasChangesUpdate');
  }

  dispose() {
    this.removeAllListeners("changeName");
    this.removeAllListeners("changedName");
    this.removeAllListeners("changeNameEditable");
    this.removeAllListeners("hasChangesUpdate");
  }
}
