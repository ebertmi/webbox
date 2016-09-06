import Sourcebox from '@sourcebox/web';
import isString from 'lodash/isString';
import pathModule from 'path';
import { Severity } from './../severity';

import Project from './project';
import Runner from './sourceboxRunner';
import { EventLog } from '../insights/remoteDispatcher';

const PROCESS_DEFAULTS = {
  term: true
};

/**
 * The SourceboxProject handles communication and scaffolding with the sourcebox sandbox
 * for executing code (remote execution).
 *
 * @export
 * @class SourceboxProject
 * @extends {Project}
 */
export default class SourceboxProject extends Project {
  constructor(projectData, serverConfig) {
    super(projectData);

    let {server, ...sbConfig} = serverConfig;
    this.sourcebox = new Sourcebox(server, sbConfig);

    // register error handler
    this.sourcebox.on('error', this.onError.bind(this));

    // Register to special tab events
    this.removeTab = this.removeTab.bind(this);
    this.tabManager.on('tabremoved', this.removeTab);
  }

  /**
   * Shows Error Messages that come from sourcebox
   */
  onError(error) {
    console.warn(error);
    this.showMessage(Severity.Error, 'Es ist ein Fehler augetreten. Ggf. kann keine Verbindung hergestellt werden. Bei Problemen bitte die Seite neu laden.');
  }

  exec(cmd, args=[], options=PROCESS_DEFAULTS) {
    let combinedOptions = Object.assign({}, {env: this.config.env}, options);
    let process = this.sourcebox.exec('bash', args, combinedOptions);

    this.tabManager.addTab('process', {
      item: process,
      callback: function () {
        process.kill('SIGHUP');
      }
    });

    let index = this.tabManager.getTabs().length - 1;


    process.on('exit', () => {
      this.tabManager.closeTab(index);
    });

    process.on('error', (error) => {
      this.showMessage(Severity.Error, error);
    });
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

    let index = this.tabManager.getTabs().findIndex(tab => tab.item === this.runner);

    // open terminal as split view
    if (!this.tabManager.getTabs()[index].active) {
      this.tabManager.toggleTab(index);
    }

    this.runner.run();
  }

  stop() {
    if (this.isRunning()) {
      this.runner.stop();
    }
  }

  test() {
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

    let index = this.tabManager.getTabs().findIndex(tab => tab.item === this.runner);

    // open terminal as split view
    if (!this.tabManager.getTabs()[index].active) {
      this.tabManager.toggleTab(index);
    }

    this.runner.test();
  }

  removeTab(tab) {
    // special file tab handling
    if (tab.type === 'file') {
      // delete file from disk to avoid using old files
      var filePath = tab.item.getName();
      this.deleteFile(filePath);
    }
  }

  // ToDo: renaming should also delete the file
  renameFile(tab) {
    // special file tab handling
    if (tab.type === 'file') {
      // delete file from disk to avoid using old files
      var filePath = tab.item.getName();
      this.deleteFile(filePath);
    }
  }

  deleteFile(filename) {
    if (filename == null || !isString(filename)) {
      console.warn('SourceboxProject.deleteFile called with invalid filename');
      return;
    }

    let path = this.name || '.';
    path = pathModule.join(path, filename);

    return this.sourcebox.rm([path], { term: false }, e => {
      // ignore this
    }); // call rm method
  }

  isRunning() {
    return this.runner && this.runner.isRunning();
  }
}
