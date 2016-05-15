import Sourcebox from '@sourcebox/web';
import isString from 'lodash/isString';
import pathModule from 'path';
import { Severity  } from './severity';

import Project from './project';
import Runner from './sourceboxRunner';
import languages from './languages';

const PROCESS_DEFAULTS = {
  term: true
};

export default class SourceboxProject extends Project {
  constructor(data, serverConfig) {
    super(data);

    if (isString(data.meta.language)) {
      this.config = languages[data.meta.language];
    } else {
      this.config = data.meta.language;
    }

    let {server, ...sbConfig} = serverConfig;
    this.sourcebox = new Sourcebox(server, sbConfig);

    // register error handler
    this.sourcebox.on('error', this.onError.bind(this));

    this.status.setLanguageInformation(this.config.displayName);
  }

  /**
   * Shows Error Messages that come from sourcebox
   */
  onError(error) {
    this.showMessage(Severity.Error, error);
  }

  exec(cmd, args=[], options=PROCESS_DEFAULTS) {
    let combinedOptions = Object.assign({}, {env: this.config.env}, options);
    console.log(combinedOptions);
    let process = this.sourcebox.exec('bash', args, combinedOptions);

    this.addTab('process', {
      item: process,
      callback: function () {
        process.kill('SIGHUP');
      }
    });

    let index = this.tabs.length - 1;

    process.on('exit', () => {
      this.closeTab(index);
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

  stop() {
    if (this.isRunning()) {
      this.runner.stop();
    }
  }

  removeTab(tab, index) {
    super.removeTab(tab, index);

    // special file tab handling
    if (tab.type === 'file') {
      // delete file from disk to avoid using old files
      var filePath = tab.item.getName();
      this.deleteFile(filePath);


    }
  }

  deleteFile(filename) {
    let path = this.name || '.';
    path = pathModule.join(path, filename);

    return this.sourcebox.rm([path], { term: false }); // call rm method
  }

  isRunning() {
    return this.runner && this.runner.isRunning();
  }
}
