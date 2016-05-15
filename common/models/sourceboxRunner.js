import { EventEmitter } from 'events';
import { Transform, PassThrough } from 'stream';
import pathModule from 'path';

import Promise from 'bluebird';
import uniq from 'lodash/uniq';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import split from 'split2';

import { Turtle } from '../turtle/turtle';

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

/**
 * Transforms a binary stream into an PNG-Image:
 * 1. STARTIMAGE first 11 Bytes
 * 2. DATA
 * 3. ENDIMAGE last 8 Bytes
 */
class MatplotLibTransfrom extends Transform {
  constructor(project, options) {
    super(options);

    this.project = project;

    this.imageBuffer = null;
    this.isImageStart = false;
    this.isImageEnd = false;
    this.imageParts = [];
  }

  _transform (chunk, encoding, callback) {
    if (chunk.length >= 8 && chunk.slice(-8).toString() === "ENDIMAGE") {
      this.isImageStart = false;
      this.isImageEnd = false;

      this.imageParts.push(chunk.slice(0, -9));
      console.info('MPLStream: ENDIMAGE %d', chunk.length);

      // must be called after appending the last image part
      this._createImageFromBuffer();
    } else if (chunk.length >= 11 && chunk.slice(-11).toString() === "STARTIMGAGE") {
      this.isImageStart = true;
      this.isImageEnd = false;
      this.imageBuffer = null;

      this.imageParts.push(chunk.slice(11));
      console.info('MPLStream: STARTIMGAGE %d', chunk.length);
    } else {
      this.imageParts.push(chunk);
      console.info('MPLStream: DATA %d', chunk.length);
    }

    callback();
  }

  // Create an internal image blob (stored in the browser ressources) and open tab for displaying
  _createImageFromBuffer () {
    var blob = new Blob(this.imageParts, {type: "image/png"});
    var imgSrc = window.URL.createObjectURL(blob);
    var img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      this.project.addTab('matplotlib', {item: img, active: true});
    };
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
      term: false,
      env: this.config.env
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

    this._status(this.config.exec.join(' '), false); // output run call

    let command = this._commandArray(this.config.exec);

    this.process = this.sourcebox.exec(command.shift(), command, {
      term: true,
      cwd: this.path,
      env: this.config.env,
      streams: this.config.streams,
      streamsObjectMode: this.config.streamsObjectMode
    });

    this.process.on('error', (error) => {
      console.log(error);
      this.project.showMessage('danger', 'Verbindung zum Server fehlgeschlagen.');
    });

    this.stdin.pipe(this.process.stdin);
    this.process.stdout.pipe(this.stdout, {end: false});

    // check for matplotlib stream
    if (this.process.stdio[3]) {
      var mplTransform = new MatplotLibTransfrom(this.project);
      this.process.stdio[3].pipe(mplTransform, {end: false});
    }

    // turtle streams
    if (this.process.stdio[4] && this.process.stdio[5]) {
      let turtle = new Turtle(this.process.stdio[4], this.process.stdio[5], this.project);
      //this.process.stdio[4].pipe(this.stdout, {end: false});
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

  _status(msg, dashes=true) {
    let dash = dashes ? ' ---- ' : '';
    this.stdout.write(`\x1b[34m${dash}${msg}${dash}\x1b[m\r\n`);
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
