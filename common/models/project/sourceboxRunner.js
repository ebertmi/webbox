import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import pathModule from 'path';

import Promise from 'bluebird';
import uniq from 'lodash/uniq';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import split from 'split2';

import { Turtle } from '../../turtle/turtle';
import { EventLog } from '../insights/socketConnection';
import TestResult from '../testResult';
import { TerminalTransform, MatplotLibTransfrom, JsonTransform } from '../../util/streamUtils';

// Disable warnings in production
let BLUEBIRD_WARNINGS = true;
if (process.env.NODE_ENV === 'production') {
  BLUEBIRD_WARNINGS = false;
}

/**
 * Allows to cancel promises (bluebird specific)
 */
Promise.config({
  cancellation: true,
  warnings: BLUEBIRD_WARNINGS
});

function processPromise(process, cleanExit) {
  return new Promise((resolve, reject, onCancel) => {
    process.on('error', err => {
      reject(err);
    });

    process.on('exit', (code, signal) => {
      if (code === 0 || !cleanExit) {
        resolve();
      } else {
        let error = new Error('Command failed: ' + process.spawnfile);
        error.code = code;
        error.signal = signal;

        reject(error);
      }
    });

    onCancel(() => {
      process.kill();
    });
  });
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

    this.createStdio();
  }

  createStdio() {
    this.stdin = new PassThrough();
    this.stdout = new PassThrough();
    this.stderr = this.stdout;

    this.stdio = [this.stdin, this.stdout, this.stderr];

    this.emit('streamsChanged');
  }

  test() {
    if (this.isRunning()) {
      return;
    }

    // Reset stdin, this avoid any unwanted buffered inputs
    this.createStdio();

    this.files = this.project.getFiles();
    this.path = this.project.name || '.';
    this.config = this.project.config;

    // Now get the tests file and add it to our files array;
    let testFile = this.project.getTestCode();
    this.files.push(testFile);

    let command = this._commandArray(this.project.config.test);
    //let runEvent = new EventLog(EventLog.NAME_RUN, { execCommand: command });
    //this.project.sendEvent(runEvent);

    let emitChange = () => {
      process.nextTick(() => {
        this.project.emitChange();
      });
    };

    emitChange();

    this.promiseChain = this._ensureDirs()
      .bind(this)
      .then(this._writeFiles)
      .then(this._compile)
      .then(this._test)
      .tap(() => {
        this._status('\n', false);
        this._status('Test beendet', true);
      })
      .catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.trace(err);
        }

        this._status(err.message);
      })
      .finally(() => {
        // Try to delete the test file
        this.project.deleteFile(testFile.getName());
        emitChange();
      });
  }

  /**
   * Run is the main entry method for starting a process:
   *  1. Write all files on the disk
   *  2. Try to compile (depending of the language)
   *  3. Try to execute (if other steps are successfull or are skipped)
   */
  run() {
    if (this.isRunning()) {
      return;
    }

    // Reset stdin, this avoid any unwanted buffered inputs
    this.createStdio();

    this.files = this.project.getFiles();
    this.path = this.project.name || '.';
    this.config = this.project.config;

    let command = this._commandArray(this.project.config.exec);
    let runEvent = new EventLog(EventLog.NAME_RUN, { execCommand: command });
    this.project.sendEvent(runEvent);

    let emitChange = () => {
      process.nextTick(() => {
        this.project.emitChange();
      });
    };

    emitChange();

    this.promiseChain = this._ensureDirs()
      .bind(this)
      .then(this._writeFiles)
      .then(this._compile)
      .then(this._exec)
      .tap(() => {
        this._status('\n', false);
        this._status('Ausführung Beendet', true);
      })
      .catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.trace(err);
        }

        this._status(err.message);
      })
      .finally(() => {
        emitChange();
      });
  }

  /**
   * Stops the current process
   */
  stop() {
    if (this.isRunning()) {
      this.promiseChain.cancel();
      this._status('\n', false);
      this._status('Ausführung abgebrochen', true);
    }
  }

  /**
   * Creates all directory that are required for writing the files
   */
  _ensureDirs() {
    let paths = this.files.map(file => {
      let path = pathModule.join(this.path, file.getName());
      return pathModule.dirname(path);
    }).filter(path => path !== '.');

    if (paths.length) {
      return this.sourcebox.mkdir(uniq(paths), {
        parents: true
      });
    } else {
      return Promise.resolve();
    }
  }

  /**
   * Writes all files on the disk of the sourcebox
   */
  _writeFiles() {
    return Promise.map(this.files, file => {
      let path = pathModule.join(this.path, file.getName());
      return this.sourcebox.writeFile(path, file.getValue());
    });
  }

  /**
   * Tries to compile the sourcecode, if configured (see languages.js)
   */
  _compile() {
    if (!this.config.compile) {
      return;
    }

    this._status('Übersetze Quellcode');

    let command = this._commandArray(this.config.compile);

    this._status(command.join(' '), false);

    let compiler = this.sourcebox.exec(command.shift(), command, {
      cwd: this.path,
      term: false,
      env: this.config.env
    });

    let transform = new TerminalTransform();

    // ToDo: Pipe stderr to special buffer, so that we can analyze the errors
    compiler.stderr.pipe(transform, {end: false});
    compiler.stdout.pipe(transform, {end: false});

    streamPromise(compiler.stdout, compiler.stderr).then(() => {
      transform.end();
    });

    transform.pipe(this.stdout, {end: false});

    if (isFunction(this.config.parser)) {
      let parser = this.config.parser();

      compiler.stderr.pipe(split()).pipe(parser);

      let annotationMap = {};

      parser.on('data', data => {
        let {file, ...annotation} = data;

        if (annotation.row != null) {
          annotation.row--;
        }

        if (annotation.column != null) {
          annotation.column--;
        }

        let array = annotationMap[file] = annotationMap[file] || [];
        array.push(annotation);
      });

      parser.on('end', () => {
        this.files.forEach((file) => {
          let annotations = annotationMap[file.getName()];
          file.setAnnotations(annotations || []);
        });
      });
    }

    return Promise.join(processPromise(compiler, true).reflect(), streamPromise(transform), compilePromise => {
      if (compilePromise.isRejected()) {
        throw new Error('Übersetzen fehlgeschlagen');
      }
    });
  }

  /**
   * Executes the process with the provides config params (see languages.js)
   */
  _exec() {
    if (!this.config.exec) {
      throw new Error('No exec command');
    }

    let annotationMap = {};

    let command = this._commandArray(this.config.exec);

    this._status(command.join(' '), false); // output run call

    this.process = this.sourcebox.exec(command.shift(), command, {
      term: true,
      cwd: this.path,
      env: this.config.env,
      streams: this.config.streams,
      streamsObjectMode: this.config.streamsObjectMode
    });

    this.process.on('error', (error) => {
      this.project.showMessage('danger', 'Verbindung zum Server fehlgeschlagen.');

      // Log the failure, maybe something weird has happend
      let failureEvent = new EventLog(EventLog.NAME_FAILURE, { message: error.message } );
      this.project.sendEvent(failureEvent);
    });

    // Pipe stderr through our error logger, to get the error message
    if (this.config.errorParser) {
      if (isFunction(this.config.errorParser.clear)) {
        this.config.errorParser.clear(); // reset parser
      }
      this.process.stderr.pipe(split()).pipe(this.config.errorParser, { end: false });
    }

    this.stdin.pipe(this.process.stdin);
    this.process.stdout.pipe(this.stdout, {end: false});

    // check for matplotlib stream
    if (this.process.stdio[3]) {
      var mplTransform = new MatplotLibTransfrom(this.project);
      this.process.stdio[3].pipe(mplTransform, {end: false});
    }

    // turtle streams
    if (this.process.stdio[4]) {
      new Turtle({
        fromServer: this.process.stdio[4],
        toServer: this.process.stdio[4],
        stdout: this.stdout
      }, this.project);
    }

    return Promise.join(processPromise(this.process, false).reflect(), streamPromise(this.process.stdout), processPromise => {
      if (processPromise.isRejected()) {
        throw new Error('Ausführen fehlgeschlagen');
      }
    }).finally(() => {
      // Check for any error that might occur
      if (this.config.errorParser && this.config.errorParser.hasError()) {
        let errObj = this.config.errorParser.getAsObject();

        // Try to get file content
        let tabIndex = this.project.getIndexForFilename(errObj.file.replace('./', ''));

        let fileContent = tabIndex > -1 ? this.project.tabManager.getTabs()[tabIndex].item.getValue() : '';

        let errorEvent = new EventLog(EventLog.NAME_ERROR, Object.assign({}, errObj, { fileContent: fileContent }));
        this.project.sendEvent(errorEvent);
        console.info(errorEvent);

        let normalizedFileName = errObj.file.replace('./', '');
        if (annotationMap[normalizedFileName] == null) {
          annotationMap[normalizedFileName] = [];
        }
        annotationMap[normalizedFileName].push({
          row: errObj.line - 1,
          column: errObj.column != null ? errObj.column  : 0,
          text: errObj.message,
          type: 'error'
        });
      }

      this.files.forEach((file) => {
        let annotations = annotationMap[file.getName()];
        file.setAnnotations(annotations || []);
      });


      this.stdin.unpipe(this.process.stdin);
      delete this.process;
    });
  }

  /**
   * Tests the project (see languages.js)
   */
  _test() {
    if (!this.config.test) {
      throw new Error('No test command');
    }

    let annotationMap = {};

    let command = this._commandArray(this.config.test);

    this._status("Überprüfe das Programm", false); // output run call

    this.process = this.sourcebox.exec(command.shift(), command, {
      term: true,
      cwd: this.path,
      env: this.config.env,
      streams: this.config.streams,
      streamsObjectMode: this.config.streamsObjectMode
    });

    this.process.on('error', (error) => {
      this.project.showMessage('danger', 'Verbindung zum Server fehlgeschlagen.');

      // Log the failure, maybe something weird has happend
      let failureEvent = new EventLog(EventLog.NAME_FAILURE, { message: error.message } );
      this.project.sendEvent(failureEvent);
    });

    // Pipe stderr through our error logger, to get the error message
    if (this.config.errorParser) {
      if (isFunction(this.config.errorParser.clear)) {
        this.config.errorParser.clear(); // reset parser
      }
      this.process.stderr.pipe(split()).pipe(this.config.errorParser, { end: false });
    }

    this.stdin.pipe(this.process.stdin);
    this.process.stdout.pipe(this.stdout, {end: false});

    // ToDo: put this into languages.js as a hook
    // check for matplotlib stream
    //if (this.process.stdio[3]) {
    //  var mplTransform = new MatplotLibTransfrom(this.project);
    //  this.process.stdio[3].pipe(mplTransform, {end: false});
    //}

    // turtle streams
    /*if (this.process.stdio[4]) {
      new Turtle({
        turtle: this.process.stdio[4],
        stdout: this.stdout
      }, this.project);
    }*/

    // after Streams hook
    if (this.process.stdio[5]) {

      this.process.stdio[5].pipe(new JsonTransform(result => {
        let testResult = new TestResult(result);
        this.project.tabManager.addTab('testresult', { item: testResult, active: true});
      }, { objectMode: true } ), { end: false });
    }

    return Promise.join(processPromise(this.process, false).reflect(), streamPromise(this.process.stdout), processPromise => {
      if (processPromise.isRejected()) {
        throw new Error('Ausführen fehlgeschlagen');
      }
    }).finally(() => {
      // Check for any error that might occur
      if (this.config.errorParser && this.config.errorParser.hasError()) {
        let errObj = this.config.errorParser.getAsObject();

        // Try to get file content
        let tabIndex = this.project.getIndexForFilename(errObj.file.replace('./', ''));

        let fileContent = tabIndex > -1 ? this.project.tabManager.getTabs()[tabIndex].item.getValue() : '';

        let errorEvent = new EventLog(EventLog.NAME_ERROR, Object.assign({}, errObj, { fileContent: fileContent }));
        this.project.sendEvent(errorEvent);
        console.info(errorEvent);

        let normalizedFileName = errObj.file.replace('./', '');
        if (annotationMap[normalizedFileName] == null) {
          annotationMap[normalizedFileName] = [];
        }
        annotationMap[normalizedFileName].push({
          row: errObj.line - 1,
          column: errObj.column != null ? errObj.column  : 0,
          text: errObj.message,
          type: 'error'
        });
      }

      this.files.forEach((file) => {
        let annotations = annotationMap[file.getName()];
        file.setAnnotations(annotations || []);
      });


      this.stdin.unpipe(this.process.stdin);
      delete this.process;
    });
  }

  /**
   * Outputs our status messages on the terminal with special formatting
   */
  _status(msg, dashes=true) {
    let dash = dashes ? ' ---- ' : '';
    this.stdout.write(`\x1b[34m${dash}${msg}${dash}\x1b[m\r\n`);
  }

  _commandArray(command) {
    let fileNames = this.files.map(file => file.getName());

    // Try to get the main file if configured, else use first file
    let mainFile = this.project.getMainFile();

    if (mainFile == null) {
      mainFile = fileNames[0];
    }

    if (isString(command)) {
      command = command.replace(/\$FILES/, () => {
        return fileNames.map(name => `'${name}'`).join(' ');
      });

      if (mainFile) {
        command = command.replace(/\$MAINFILE/, mainFile);
      }

      return ['bash', '-c', command];
    } else if (isFunction(command)) {
      return command(fileNames, mainFile, this.project.name);
    } else if (Array.isArray(command)) {
      return command.slice();
    }
  }

  /**
   * Returns true if the process is currently running
   */
  isRunning() {
    return this.promiseChain && this.promiseChain.isPending();
  }

  kill() {
    this.stop();
  }

  resize(cols, rows) {
    if (this.process) {
      this.process.resize(cols, rows);
    }
  }
}
