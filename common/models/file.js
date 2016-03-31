import Ace, {EditSession, UndoManager} from 'ace';

const modelist = Ace.require('ace/ext/modelist');

export default class File extends EditSession {
  constructor(name, text='', mode=modelist.getModeForPath(name).mode) {
    super(text, mode);
    this.setUndoManager(new UndoManager);
    this._name = name;
  }

  setName(name) {
    this._name = name;
    this.emit('changeName');
  }

  getName() {
    return this._name;
  }
}

File.prototype.addListener = File.prototype.addEventListener;
