import { Severity } from './../severity';

import Project from './project';
import Runner from './skulptRunner';

export default class SkulptProject extends Project {
  constructor(projectData) {
    super(projectData);
  }

  /**
   * Shows Error Messages that come from sourcebox
   * @param {Error} error - error to display
   * @returns {void}
   */
  onError(error) {
    this.showMessage(Severity.Error, error);
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

      this.tabManager.addTab('process', {
        item: this.runner,
        active: false,
        callback: () => {
          this.runner.stop();
          delete this.runner;
        }
      });
    }

    const index = this.tabManager.getTabs().findIndex(tab => tab.item === this.runner);

    // open terminal as split view
    if (!this.tabManager.getTabs()[index].active) {
      this.tabManager.toggleTab(index);
    }

    this.runner.run();
  }

  readFile(name) {
    // ToDo: is this the right way of handling files on the same hierarchy?
    const file = this.getFileForName(name.replace('./', ''));

    if (file != null) {
      return file.getValue();
    }

    return null;
  }

  writeFile(name, mode) {
    // ToDo
  }

  stop() {
    if (this.isRunning()) {
      this.runner.stop();
    }
  }

  removeTab(tab) {
    // special file tab handling
    if (tab.type === 'file') {
      this.setUnsavedChanges(true);
    }
  }

  isRunning() {
    return this.runner && this.runner.isRunning();
  }
}
