import {EventEmitter} from 'events';
import {Transform, PassThrough} from 'stream';
import pathModule from 'path';

import Promise from 'bluebird';
import uniq from 'lodash/uniq';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import split from 'split2';

Promise.config({
  cancellation: true
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

class TerminalTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().replace(/\n/g, '\r\n'));
    callback();
  }
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

  run() {
    if (this.isRunning()) {
      return;
    }

    this.files = this.project.getFiles();
    this.path = this.project.name || '.';
    this.config = this.project.config;

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
        this._status('Ausführung Beendet');
      })
      .catch((err) => {
        this._status(err.message);
      })
      .finally(() => {
        emitChange();
      });
  }

  stop() {
    if (this.isRunning()) {
      this.promiseChain.cancel();
      this._status('Ausführung abgebrochen');
    }
  }

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

  _writeFiles() {
    return Promise.map(this.files, file => {
      let path = pathModule.join(this.path, file.getName());
      return this.sourcebox.writeFile(path, file.getValue());
    });
  }

  _compile() {
    if (!this.config.compile) {
      return;
    }

    this._status('Übersetze Quellcode');

    let command = this._commandArray(this.config.compile);

    let compiler = this.sourcebox.exec(command.shift(), command, {
      cwd: this.path,
      term: false
    });

    let transform = new TerminalTransform();
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

  _exec() {
    if (!this.config.exec) {
      throw new Error('No exec command');
    }

    this._status('Führe Programm aus');

    let command = this._commandArray(this.config.exec);

    this.process = this.sourcebox.exec(command.shift(), command, {
      term: true,
      cwd: this.path
    });

    this.stdin.pipe(this.process.stdin);
    this.process.stdout.pipe(this.stdout, {end: false});

    return Promise.join(processPromise(this.process, false).reflect(), streamPromise(this.process.stdout), processPromise => {
      if (processPromise.isRejected()) {
        throw new Error('Ausführen fehlgeschlagen');
      }
    }).finally(() => {
      this.stdin.unpipe(this.process.stdin);
      delete this.process;
    });
  }

  _status(msg) {
    this.stdout.write(`\x1b[34m ---- ${msg} ---- \x1b[m\r\n`);
  }

  _commandArray(command) {
    let fileNames = this.files.map(file => file.getName());
    // for now we will just use the first file as the "main file"
    let mainFile = fileNames[0];

    if (isString(command)) {
      command = command.replace(/\$FILES/, () => {
        return fileNames.map(name => `'${name}'`).join(' ');
      });

      if (mainFile) {
        command = command.replace(/\$MAINFILE/, mainFile);
      }

      return ['bash', '-c', command];
    } else if (isFunction(command)) {
      return command(fileNames, mainFile);
    } else if (Array.isArray(command)) {
      return command.slice();
    }
  }

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
