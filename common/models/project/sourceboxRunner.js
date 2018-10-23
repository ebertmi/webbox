import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import pathModule from 'path';

import Promise from 'bluebird';
import uniq from 'lodash/uniq';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import split from 'split2';

import { Turtle } from '../../turtle/turtle';
import { RemoteActions } from '../../constants/Embed';
import { EventLog, Action as RemoteAction } from '../insights/remoteDispatcher';
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
  warnings: BLUEBIRD_WARNINGS,
  longStackTraces: true
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
        const error = new Error(`Command failed: ${  process.spawnfile}`);
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
    //this.sourcebox = project.sourcebox;
    this.id = this.project.getEmbedId();

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
    const testFile = this.project.getTestCode();
    this.files.push(testFile);

    const emitChange = () => {
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
      .then(this.reloadFiles)
      .then(this.processExecErrors)
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
   *
   * @returns {void}
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

    const command = this._commandArray(this.project.config.exec);
    const runEvent = new EventLog(EventLog.NAME_RUN, { execCommand: command });
    this.project.sendEvent(runEvent);

    const emitChange = () => {
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
      .then(this.reloadFiles)
      .then(this.processExecErrors)
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
   *
   * @returns {void}
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
   *
   * @returns {Promise} - chainable promise
   */
  _ensureDirs() {
    const paths = this.files.map(file => {
      const path = pathModule.join(this.path, file.getName());
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
   *
   * @returns {Promise} - chainable promise
   */
  _writeFiles() {
    return Promise.map(this.files, file => {
      const path = pathModule.join(this.path, file.getName());
      return this.sourcebox.writeFile(path, file.getValue());
    });
  }

  /**
   * Tries to compile the sourcecode, if configured (see languages.js)
   *
   * @returns {Promise} - chainable promise
   * @throws {Error} - when failing to compile or sub steps are failing
   */
  _compile() {
    if (!this.config.compile) {
      return;
    }

    this._status('Übersetze Quellcode');

    const command = this._commandArray(this.config.compile);

    this._status(command.join(' '), false);

    const compiler = this.sourcebox.exec(command.shift(), command, {
      cwd: this.path,
      term: false,
      env: this.config.env
    });

    const transform = new TerminalTransform();

    // ToDo: Pipe stderr to special buffer, so that we can analyze the errors
    compiler.stderr.pipe(transform, {end: false});
    compiler.stdout.pipe(transform, {end: false});

    streamPromise(compiler.stdout, compiler.stderr).then(() => {
      transform.end();
    });

    transform.pipe(this.stdout, {end: false});

    if (isFunction(this.config.parser)) {
      const parser = this.config.parser();

      compiler.stderr.pipe(split()).pipe(parser);

      const annotationMap = {};

      parser.on('data', data => {
        const {file, ...annotation} = data;

        if (annotation.row != null) {
          annotation.row--;
        }

        if (annotation.column != null) {
          annotation.column--;
        }

        const array = annotationMap[file] = annotationMap[file] || [];
        array.push(annotation);
      });

      parser.on('end', () => {
        this.files.forEach((file) => {
          const annotations = annotationMap[file.getName()];
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
   *
   * @returns {Promise} execution promise
   */
  _exec() {
    if (!this.config.exec) {
      throw new Error('No exec command');
    }

    //let annotationMap = {};

    const command = this._commandArray(this.config.exec);

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
      const failureEvent = new EventLog(EventLog.NAME_FAILURE, { message: error.message } );
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
      const mplTransform = new MatplotLibTransfrom(this.project);
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


      this.stdin.unpipe(this.process.stdin);
      delete this.process;
    });
  }

  /**
   * Tests the project (see languages.js)
   *
   * @returns {Promise} test promise
   */
  _test() {
    if (!this.config.test) {
      throw new Error('No test command');
    }

    const command = this._commandArray(this.config.test);

    this._status('Überprüfe das Programm', false); // output run call

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
      const failureEvent = new EventLog(EventLog.NAME_FAILURE, { message: error.message } );
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

    // after Streams hook
    if (this.process.stdio[5]) {

      this.process.stdio[5].pipe(new JsonTransform(result => {
        const testResult = new TestResult(result);

        // Try to send the results to the Server

        const remoteAction = new RemoteAction(RemoteActions.TestResult, this.project.getUserData(), {
          embedId: this.project.getEmbedId(),
          score: testResult.getScore(),
          scorePercentage: testResult.getScorePercentage(),
          data: result
        });
        this.project.sendAction(remoteAction);

        // Additonally, store the test result on the server with its data
        const testEvent = new EventLog(EventLog.NAME_TEST, { data: result });
        this.project.sendEvent(testEvent);

        this.project.tabManager.closeTabByType('testresult'); // Close all other test result windows
        this.project.tabManager.addTab('testresult', { item: testResult, active: true});
      }, { objectMode: true } ), { end: false });
    }

    return Promise.join(processPromise(this.process, false).reflect(), streamPromise(this.process.stdout), processPromise => {
      if (processPromise.isRejected()) {
        throw new Error('Ausführen fehlgeschlagen');
      }
    }).finally(() => {
      this.stdin.unpipe(this.process.stdin);
      delete this.process;
    });
  }

  /**
   * Outputs our status messages on the terminal with special formatting
   * @param {string} msg - message
   * @param {boolean} dashes - surroundes message with four dashes
   *
   * @returns {void}
   */
  _status(msg, dashes=true) {
    const dash = dashes ? ' ---- ' : '';
    this.stdout.write(`\x1b[34m${dash}${msg}${dash}\x1b[m\r\n`);
  }

  /**
   * Creates a command array for the given command. Automatically replaces the
   * main file name (depending on the language configuration) and the other files
   * names.
   *
   * @param {String|Array} command - one or more commands
   * @returns {Array} - array of commands
   * @memberof Runner
   */
  _commandArray(command) {
    const fileNames = this.files.map(file => file.getName());

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

    throw new Error('Parameter \'command\' can only be of type string or array of strings');
  }

  processExecErrors() {
    const annotationMap = {};
    // Check for any error that might occur
    const files = this.project.getFiles();
    if (this.config.errorParser && this.config.errorParser.hasError()) {
      const errObj = this.config.errorParser.getAsObject();

      // Try to get file content
      const tabIndex = this.project.getIndexForFilename(errObj.file.replace('./', ''));

      const fileContent = tabIndex > -1 ? this.project.tabManager.getTabs()[tabIndex].item.getValue() : '';

      const errorEvent = new EventLog(EventLog.NAME_ERROR, Object.assign({}, errObj, { fileContent: fileContent }));
      this.project.sendEvent(errorEvent);

      const normalizedFileName = errObj.file.replace('./', '');

      if (annotationMap[normalizedFileName] == null) {
        annotationMap[normalizedFileName] = [];
      }

      annotationMap[normalizedFileName].push({
        row: errObj.line - 1,
        column: errObj.column != null ? errObj.column : 0,
        text: errObj.message,
        type: 'error',
        raw: errObj.raw
      });
    }

    files.forEach((file) => {
      const annotations = annotationMap[file.getName()];
      if (annotations != null) {
        file.setAnnotations(annotations);
        file.emit('changeAnnotation');
      } else {
        file.clearAnnotations();
      }
    });
  }

  reloadFiles() {
    const files = this.project.getFiles();
    const projectBasePath = this.project.name || '.';

    //console.info(files);

    //let cmd = this.sourcebox.exec('ls', ['-l', '-t'], {
    //  cwd: this.path,
    //  term: false,
    //  env: this.config.env
    //});
    //console.info(cmd);
    //run-parts --list --regex . Kap18\ -\ Formatiertes\ Schreiben/
    //then(res => {
    //  console.info('ls:', res);
    //});

    return Promise.map(files, (file) => {
      const path = pathModule.join(projectBasePath, file.getName());
      return this.sourcebox.readFile(path)
        .bind(this)
        .then(contents => {
          const fileIndex = files.findIndex(f => f.getName() == file.getName());

          // Only update, when we have real changes
          // I guess we will never have 10k lines of code to compare here, hashing does also required
          // to iterate over all characters, so the normal comparing is pretty cheap
          if (fileIndex >= 0 && files[fileIndex].getValue() !== contents) {
            files[fileIndex].setValue(contents);
          } else {
            // ToDo: new file
          }
        });
    });
  }

  /**
   * Returns true if the process is currently running
   *
   * @returns {boolean} true if the process is still running
   */
  isRunning() {
    return this.promiseChain && this.promiseChain.isPending();
  }

  /**
   * Tries to stop the currently running process / runner
   * @returns {void}
   * @memberof Runner
   */
  kill() {
    this.stop();
  }

  /**
   * Resizes the attached tty of the proccess
   *
   * @param {any} cols - columns
   * @param {any} rows - rows
   * @memberof Runner
   * @returns {void}
   */
  resize(cols, rows) {
    if (this.process) {
      this.process.resize(cols, rows);
    }
  }
}
