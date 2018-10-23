// all IDEs share the same options, so this is singleton
// options get saved in local storage

import { EventEmitter } from 'events';
import defaultsDeep from 'lodash/defaultsDeep';
import clone from 'lodash/clone';

const LOCAL_STORAGE_KEY = 'sourcebox.options';

const DEFAULT_OPTIONS = {
  fontSize: 14,
  font: 'Monaco, Menlo, "Ubuntu Mono", source-code-pro, Consolas, "Courier New", monospace',
  terminal: {
    audibleBell: true
  },
  editor: {
    automaticLayout: false,
    cursorStyle: 'line',
    minimap: {
      enabled: false
    },
    readOnly: false,
    renderWhitespace: false,
    renderIndentGuides: false,
    renderLineHighlight: 'line',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    selectionHighlight: true,
    selectOnLineNumbers: true,
    theme: 'vs-dark'
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

    this.setMaxListeners(0);
  }

  init() {
    this.options = defaultsDeep({}, DEFAULT_OPTIONS);

    try {
      const savedOptions = JSON.parse(localStorage[LOCAL_STORAGE_KEY]);
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

  getEditorOptions() {
    const options = clone(this.options.editor);

    options.fontSize = this.options.fontSize;
    options.fontFamily = this.options.font;

    return options;
  }

  emitChange() {
    this.emit('change');
  }
}

export default new OptionManager();
