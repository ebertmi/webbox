import { EventEmitter } from 'events';
import { PassThrough, } from 'stream';

import Promise from 'bluebird';
import uniq from 'lodash/uniq';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import split from 'split2';
import { EventLog } from './socketConnection';
import { TerminalTransform } from '../util/streamUtils';

Promise.config({
  cancellation: true
});


const RUN_DEFAULTS = {
  execLimit: 30000
};

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

  _fileWrite(pyFile, str) {
    console.info('fileWrite', pyFile, str);
    if (pyFile.mode === 'r') {
      throw new Sk.builtin.IOError("File is in readonly mode, cannot write");
    }

    let name = pyFile.name.replace('./', '');
    let file = this.project.getFileForName(name);

    if (file != null) {
      let value = file.getValue();
      file.setValue(value + str);
    } else {
      // error
      throw new Sk.builtin.IOError("File has been deleted, cannot write.");
    }
  }

  _fileRead(x, mode='r') {
    let name = x.replace('./', '');
    let file = this.project.getFileForName(name);

    // Check mode
    if (mode === 'w') {
      if (file != null) {
        file.setValue('');
      } else {
        // Create new file
        this.project.addFile(name, '', undefined, false);
      }

      return '';
    }

    if (file == null && mode === 'x') {
      // Create new file
      this.project.addFile(name, '', undefined, false);
      return '';
    }

    if (mode === 'b') {
      throw new Sk.builtin.IOError("Binary mode is not supported");
    }

    if (file != null) {
      return file.getValue();
    }
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
    this.files = this.project.getFiles();

    let emitChange = () => {
      process.nextTick(() => {
        this.project.emitChange();
      });
    };

    emitChange();

    // Check for python2/python3
    let isPython3 = this.project.data.meta.language === 'python3';

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
      fileread: (x, mode) => {
        return this._fileRead(x, mode);
      },
      filewrite: (pyFile, x) => {
        this._fileWrite(pyFile, x);
      },
      fileopen: pyFile => {
        console.info(pyFile);
      },
      nonreadopen: true,
      python3: isPython3,
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

  /**
   * Handles skulpt errors that occur during execution.
   *
   * @param {any} err
   */
  handleSkulptError(err) {
    let annotationMap = {};
    let errObj = this.skulptErrorToErrorObject(err);
    this._error(errObj.raw);

    let tabIndex = this.project.getIndexForFilename(errObj.file.replace('./', ''));
    let fileContent = tabIndex > -1 ? this.project.getTabs()[tabIndex].item.getValue() : '';

    let errorEvent = new EventLog(EventLog.NAME_ERROR, Object.assign({}, errObj, { fileContent: fileContent }));

    // Log error event
    this.project.sendEvent(errorEvent);

    let normalizedFileName = errObj.file.replace('./', '');

    if (annotationMap[normalizedFileName] == null) {
      annotationMap[normalizedFileName] = [];
    }

    // Add annotation for code editor
    annotationMap[normalizedFileName].push({
      row: errObj.line - 1,
      column: errObj.column != null ? errObj.column  : 0,
      text: errObj.message,
      type: 'error'
    });

    // Display annotations
    this.files.forEach((file) => {
      let annotations = annotationMap[file.getName()];
      file.setAnnotations(annotations || []);
    });
  }

  /**
   * Transforms the error/exception to a common format, that
   * is used within sourcebox/webbox.
   *
   * @param {any} err Skulpt Exception
   * @returns
   */
  skulptErrorToErrorObject(err) {
    let ret = err.toString(); // Simple output message

    // Create stacktrace message
    if (err.traceback) {
      for (let i = 0; i < err.traceback.length; i++) {
        ret += "\n  at " + err.traceback[i].filename + " line " + err.traceback[i].lineno;
        if ("colno" in err.traceback[i]) {
          ret += " column " + err.traceback[i].colno;
        }
      }
    }

    let fileName = this.getMainFile().name;
    let lineno = 0;
    let colno = 0;

    if (err.traceback && err.traceback.length > 0) {
      fileName = err.traceback[0].filename;
      lineno = err.traceback[0].lineno;
      colno = err.traceback[0].colno;
    }

    return {
      file: fileName,
      line: lineno,
      column: colno,
      error: err.tp$name || 'Error',
      message: err.toString(),
      errorHint: ret,
      raw: ret
    };
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

    let runEvent = new EventLog(EventLog.NAME_RUN, { execCommand: [command, mainFile].join(' ') });
    this.project.sendEvent(runEvent);

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
