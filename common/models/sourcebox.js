import Sourcebox from '@sourcebox/web';
import isString from 'lodash/isString';

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

    this.status.setLanguageInformation(this.config.displayName);
  }

  exec(cmd, args=[], options=PROCESS_DEFAULTS) {
    let process = this.sourcebox.exec('bash', args, options);

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
  }

  run() {
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

  isRunning() {
    return this.runner && this.runner.isRunning();
  }
}
