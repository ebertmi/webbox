import isString from 'lodash/isString';
import capitalize from 'lodash/capitalize';
import { Severity  } from './severity';

import Project from './project';
import Runner from './skulptRunner';
import languages from './languages';
import { EventLog } from './socketConnection';



export default class SkulptProject extends Project {
  constructor(data) {
    super(data);

    if (isString(data.meta.language)) {
      this.config = languages[data.meta.language];
    } else {
      this.config = data.meta.language;
    }

    this.status.setLanguageInformation(`${this.config.displayName} (${capitalize(this.data.meta.embedType)})`);
  }

  /**
   * Shows Error Messages that come from sourcebox
   */
  onError(error) {
    this.showMessage(Severity.Error, error);
  }

  exec(cmd, args=[], options={}) {
    // not implemented/possible in skulpt
  }

  run() {
    if (this.getConsistency() === false) {
      this.showMessage(Severity.Error, 'Das Projekt kann derzeit nicht ausgeführt werden. Haben Sie noch weitere Meldungen offen?');
      return;
    }

    if (this.isRunning()) {
      return;
    }

    // check if there is already our terminal for running the program
    if (!this.runner) {
      this.runner = new Runner(this);

      this.addTab('process', {
        item: this.runner,
        active: false,
        callback: () => {
          this.runner.stop();
          delete this.runner;
        }
      });
    }

    let index = this.tabs.findIndex(tab => tab.item === this.runner);

    // open terminal as split view
    if (!this.tabs[index].active) {
      this.toggleTab(index);
    }

    this.runner.run();
  }

  readFile(name){
    // ToDo: is this the right way of handling files on the same hierarchy?
    let file = this.getFileForName(name.replace('./', ''));

    if (file != null) {
      return file.getValue();
    }

    return null;
  }

  writeFile(name, mode) {

  }

  stop() {
    if (this.isRunning()) {
      this.runner.stop();
    }
  }

  isRunning() {
    return this.runner && this.runner.isRunning();
  }
}
