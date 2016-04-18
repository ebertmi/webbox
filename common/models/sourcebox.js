import Sourcebox from '@sourcebox/web';
import isString from 'lodash/isString';

import Project from './project';
import Runner from './runner';
import languages from './languages';

const PROCESS_DEFAULTS = {
  term: true
};

export default class SourceboxProject extends Project {
  constructor(name, language, serverConfig) {
    super(name);

    if (isString(language)) {
      this.config = languages[language];
    } else {
      this.config = language;
    }

    let {server, ...sbConfig} = serverConfig;
    this.sourcebox = new Sourcebox(server, sbConfig);
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

    if (this.runner) {
      let index = this.tabs.findIndex(tab => tab.item === this.runner);

      if (!this.tabs[index].active) {
        this.switchTab(index);
      }
    } else {
      this.runner = new Runner(this);

      this.addTab('process', {
        item: this.runner,
        callback: () => {
          this.runner.stop();
          delete this.runner;
        }
      });
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
