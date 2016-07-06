import { EventEmitter } from 'events';
import { Transform, PassThrough, } from 'stream';

import Promise from 'bluebird';
import uniq from 'lodash/uniq';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import split from 'split2';

Promise.config({
  cancellation: true
});


const RUN_DEFAULTS = {
  execLimit: 30000
};

/**
 * Replaces newlines (\n) with \r\n (for term.js)
 */
class TerminalTransform extends Transform {
  _transform(chunk, encoding, callback) {
    let str = chunk.toString();
    this.push(str.replace(/\n/g, '\r\n'));
    callback();
  }
}

function streamPromise(...streams) {
  return Promise.all(streams.map(stream => {
    return new Promise(resolve => {
      stream.on('end', resolve);
    });
  }));
}

// this class pretends to be a "Process", so it can be "displayed" by
// ProcessPanel and ProcessTab
export default class Runner extends EventEmitter {
  constructor(project) {
    super();

    this.project = project;
    this.sourcebox = project.sourcebox;

    this.stdin = new PassThrough();
    this.stdout = new PassThrough();
    this.stderr = this.stdout;

    this.stdio = [this.stdin, this.stdout, this.stderr];
  }

  defaultFileRead(x) {
    // Try to read local fileObject
    let file = this.project.readFile(x);

    if (file != null) {
      return file;
    }

    if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[x] === undefined) {
        throw new Error('File not found: \'' + x + '\'');
    }
    return Sk.builtinFiles.files[x];
  }

  fileWrite(pyFile, x) {
    console.info('fileWrite', pyFile, x);
  }

  fileRead(pyFile, x) {
    console.info('fileRead', pyFile, x);
  }

  getMainFile() {
    let name = this.project.data.meta.mainFile;
    let fileObject = this.project.getFileForName(name); // ToDo:
    let code = '';

    if (fileObject) {
      code = fileObject.getValue();
    }

    return {
      code: code,
      name: name
    };
  }

  run() {
    if (this.isRunning()) {
      return;
    }

    this.config = this.project.config;

    let emitChange = () => {
      process.nextTick(() => {
        this.project.emitChange();
      });
    };

    emitChange();

    // ToDo: add here check for python2/python3

    Sk.configure({
      output: text => {
        this._output(text);
      },
      inputfun: prompt => {
        this.readPrompt(prompt);
      },
      read: x => {
        return this.defaultFileRead(x);
      },
      filewrite: (pyFile, x) => {
        this.fileWrite(pyFile, x);
      },
      fileopen: pyFile => {
        console.info(pyFile);
      },
      nonreadopen: true,
      python3: true,
      execLimit: RUN_DEFAULTS.execLimit
    });

    this.stdoutTransform = new TerminalTransform();
    this.stdoutTransform.pipe(this.stdout, {end: false});

    // Wrap Skulpt native Promise with Bluebird
    this.promiseChain = this._exec()
    .tap(this._done.bind(this))
    .catch(this.handleSkulptError.bind(this))
    .finally(() => {
      //this.stdout.end();
      emitChange();
    });
  }

  handleSkulptError(err) {
    console.trace(err);

    let ret = err.toString();
    if (err.traceback) {
      for (let i = 0; i < err.traceback.length; i++) {
        ret += "\n  at " + err.traceback[i].filename + " line " + err.traceback[i].lineno;
        if ("colno" in err.traceback[i]) {
          ret += " column " + err.traceback[i].colno;
        }
      }
    }

    this._error(ret);
  }

  _output(text) {
    this.stdoutTransform.write(text);
  }

  _done() {
    this._status('Ausführung Beendet');
    this.stdoutTransform.end();
  }

  _exec() {
    if (!this.config.exec) {
      throw new Error('No exec command');
    }

    let command = ['python3']; //this._commandArray(this.config.exec);

    let mainFile = this.getMainFile();

    this._status(command.join(' '), false); // output run call

    let processPromise = new Promise((resolve, reject) => {
      Sk.misceval.asyncToPromise(() => {
        return Sk.importMainWithBody(mainFile.name.replace('.py',''), false, mainFile.code, true);
      }, {'*': this.handleInterrupt.bind(this)})
      .then(() => {
        resolve();
      },  err => {
        reject(err);
      });
    });

    return processPromise;
  }

  handleInterrupt() {
    if (this.promiseChain) {
      this.promiseChain.cancel();
    }
  }

  stop() {
    if (this.isRunning()) {
      this.promiseChain.cancel();
      this._status('Ausführung abgebrochen');
    }
  }

  _error(msg) {
    this.stdoutTransform.write(`\x1b[31m${msg}\x1b[m\r\n`);
  }

  _status(msg) {
    this.stdoutTransform.write(`\x1b[34m ---- ${msg} ---- \x1b[m\r\n`);
  }

  isRunning() {
    return this.promiseChain && this.promiseChain.isPending();
  }

  /**
   * Stub implementation, otherwise the ProcessPanel would fail
   *
   * @param {any} cols
   * @param {any} rows
   * @returns
   */
  resize(cols, rows) {
    return;
  }

  kill() {
    //this.stop();
  }
}
