// all IDEs share the same options, so this is singleton
// options get saved in local storage

import { EventEmitter } from 'events';
import defaultsDeep from 'lodash/defaultsDeep';

const LOCAL_STORAGE_KEY = 'sourcebox.options';

const DEFAULT_OPTIONS = {
  fontSize: 14,
  font: 'monospace',
  terminal: {
    audibleBell: true
  },
  ace: {
    theme: 'ace/theme/xcode',
    showInvisibles: false,
    highlightActiveLine: true,
    highlightSelectedWord: true,
    displayIndentGuides: false,
    showGutter: true,
    wrap: false,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: false
  }
};

class OptionManager extends EventEmitter {
  constructor() {
    super();

    window.addEventListener('storage', e => {
      if (e.key === LOCAL_STORAGE_KEY) {
        this.init();
        this.emitChange();
      }
    });

    this.init();
  }

  init() {
    this.options = defaultsDeep({}, DEFAULT_OPTIONS);

    try {
      let savedOptions = JSON.parse(localStorage[LOCAL_STORAGE_KEY]);
      this.options = defaultsDeep(savedOptions, this.options);
    } catch (error) {
      // ignore
    }
  }

  reset() {
    this.setOptions(DEFAULT_OPTIONS);
  }

  setOptions(options) {
    this.options = defaultsDeep({}, options, this.options);

    try {
      localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(this.options);
    } catch (error) {
      // ignore
    }

    this.emitChange();
  }

  getOptions() {
    return this.options;
  }

  emitChange() {
    this.emit('change');
  }
}

export default new OptionManager();
