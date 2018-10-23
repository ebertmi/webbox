import { EventEmitter } from "events";
import { createModel } from '../../util/monacoUtils';

/**
 * Holds a code file with the tests
 *
 * @export
 * @class Test
 * @extends {EventEmitter}
 */
export default class Test extends EventEmitter{
  constructor(metadata, text='') {
    super();
    this._name = metadata.name;
    this.metadata  = metadata;
    this.autoDetectMode();

    this.model = createModel(name, text, metadata.language);
  }

  autoDetectMode() {
    //let mode = modelist.getModeForPath(this._name).mode;
    //super.setMode(mode);
  }

  getName() {
    return this._name;
  }

  getMetadata() {
    return this.metadata;
  }

  isActive() {
    return this.metadata.active === true;
  }

  setActive(val) {
    this.metadata.active = val;
  }

  containsText() {
    return this.model.getValue() !== '';
  }

  setValue(value) {
    this.model.setValue(value);
  }

  getValue() {
    return this.model.getValue();
  }

  dispose() {
  }
}
