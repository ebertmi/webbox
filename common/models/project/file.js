/*global monaco */
import { EventEmitter } from 'events';
import isString from 'lodash/isString';
import { createModel } from '../../util/monacoUtils';
import { getLanguageByFileExtension } from '../../util/languageUtils';
import { Annotation } from '../annotation';
import { typeToSeverity } from '../severity';
import Debug from 'debug';

const debug = Debug('webbox:languageUtils');

export default class File extends EventEmitter {
  constructor(name, value, language) {
    super();

    this._name = name;
    this._isNameEditable = false;
    this._nameChanged = false;
    this.hasChanges = true; // a new file is a change, basically
    this.annotations = []; // raw annotations

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

  setAnnotations(annotations) {
    const markers = annotations.map(a => {
      return new Annotation(a.text, a.row + 1, a.column, typeToSeverity(a.type));
    });

    this.annotations = annotations;

    monaco.editor.setModelMarkers(this.model, this._name, markers);
  }

  getAnnotations() {
    return this.model.getAllDecorations();
  }

  clearAnnotations() {
    this.annotations = [];
    monaco.editor.setModelMarkers(this.model, this._name, []);
  }

  /**
   * Set the hasChanges flag to true and notify all listeners if it has changes.
   *
   * @returns {void}
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
    try {
      const extension = isString(this._name) ? this._name.split('.').pop(): 'text';
      monaco.editor.setModelLanguage(this.model, getLanguageByFileExtension(extension));
    } catch (e) {
      debug('Failed to automatically detect mode', e);
    }
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
   * @param {String} str - string to escape
   *
   * @returns {String} escaped string
   */
  escapeName(str) {
    if (!str) {
      return str;
    }

    return str.replace(/\\|[!$`&*()+]/, '');
  }

  setName(name) {
    const escapedName = this.escapeName(name);

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

  dispose() {
    this.removeAllListeners('changeName');
    this.removeAllListeners('changedName');
    this.removeAllListeners('changeNameEditable');
    this.removeAllListeners('hasChangesUpdate');
  }
}
