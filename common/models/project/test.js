import Ace, {EditSession, UndoManager} from 'ace';

const modelist = Ace.require('ace/ext/modelist');

/**
 * Holds a code file with the tests
 *
 * @export
 * @class Test
 * @extends {EditSession}
 */
export default class Test extends EditSession {
  constructor(metadata, text='') {
    super(text);
    this.setUndoManager(new UndoManager);
    this._name = metadata.name;
    this.metadata  = metadata;
    this.autoDetectMode();
  }

  autoDetectMode() {
    let mode = modelist.getModeForPath(this._name).mode;
    super.setMode(mode);
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
    return this.getValue() !== '';
  }

  dispose() {
  }
}

Test.prototype.addListener = Test.prototype.addEventListener;
