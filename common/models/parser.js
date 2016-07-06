import {Transform} from 'stream';

import capitalize from 'lodash/capitalize';

// parser spucken objekte aus:
//  {
//    file: string
//    type: 'info' | 'warning' | 'error',
//    text: string,
//    row: int,
//    column: int
//  }

function defaultCallback(matches, labels) {
  if (!labels.file || labels.row == null) {
    // file and row are required
    return;
  }

  var type = labels.type.trim();

  var text = labels.text || capitalize(type);

  if (/error/i.test(type)) {
    type = 'error';
  } else if (/warning/i.test(type)) {
    type = 'warning';
  } else if (/^e/i.test(type)) {
    type = 'error';
  } else if (/^w/i.test(type)) {
    type = 'warning';
  } else {
    // tag as info if it doesn't match any other type
    type = 'info';
  }

  labels.type = type;
  labels.text = text;

  this.push(labels);
}

function mapLabels(labels, fn) {
  return function (matches) {
    var map = labels.reduce(function (map, label, i) {
      map[label] = matches[i + 1];
      return map;
    }, {});

    return fn.call(this, matches, map);
  };
}

/**
 * Tries to parse a python error message from the std.error stream.
 * It matches always the last file and line number. ToDo: should we support stack traces?
 * If it could parse an error, it can be received with getAsObject()
 */
export class PythonErrorParser extends Transform {
  constructor() {
    super({ readableObjectMode: true });

    // Reset all variables/set to default
    this.clear();
  }

  clear() {
    this._filename = '';
    this._line = -1;
    this._error = '';
    this._errorMessage = '';
    this._buffer = [];
    this._errorHintBuffer = [];
  }

  matchFileAndLine(str){
    let matches = PythonErrorParser.FILENAME_REGEX.exec(str);

    if (matches) {
      this._filename = matches[1];
      this._line = matches[2];

      return true;
    }

    return false;
  }

  matchErrorAndMessage(str) {
    let matches = PythonErrorParser.ERROR_REGEX.exec(str);

    if (matches) {
      this._error = matches[1];
      this._errorMessage = matches[2];

      return true;
    }

    return false;
  }

  match(str) {
    let matchefFile;
    matchefFile = this.matchFileAndLine(str);
    this.matchErrorAndMessage(str);

    if (!matchefFile && this._filename !== '' && this._error === '') {
      this._errorHintBuffer.push(str);
    }
  }

  hasError() {
    return this._filename !== '' && this._error !== '';
  }

  getAsObject() {
    let raw = this._buffer.join('');

    return {
      file: this._filename,
      line: this._line,
      error: this._error,
      message: this._errorMessage,
      errorHint: this._errorHintBuffer.join('\n'),
      raw: raw
    };
  }

  _transform(chunk, encoding, callback) {
    let str = chunk.toString();
    this._buffer.push(str);
    this.match(str);

    callback();
  }
}

PythonErrorParser.FILENAME_REGEX = /^\s*File\s"(.+)",\sline\s(.*)$/;
PythonErrorParser.ERROR_REGEX = /^\s*(.+[Error|Exception|Interrupt|Exit]):\s(.*)$/;

export class RegexParser extends Transform  {
  constructor(matchers, lines) {
    super({ readableObjectMode: true });

    if (!Array.isArray(matchers)) {
      matchers = [matchers];
    }

    this.lines = lines || 1;
    this.buffer = [];

    this.matchers = matchers.map(matcher => {
      if (!matcher.regex) {
        throw new Error('Regex is required');
      }

      return {
        regex: matcher.regex,
        callback: mapLabels(matcher.labels, matcher.callback || defaultCallback)
      };
    });
  }

  match() {
    var text = this.buffer.join('\n');

    this.matchers.some(matcher => {
      var regex = matcher.regex;

      var matches = regex.exec(text);

      if (matches) {
        return matcher.callback.call(this, matches) !== false;
      }
    });
  }

  _transform(chunk, encoding, callback) {
    this.buffer.push(chunk.toString());

    if (this.buffer.length === this.lines) {
      this.match();
      this.buffer.shift();
    }

    callback();
  }

  _flush(callback) {
    if (this.buffer.length && this.buffer.length < this.lines) {
      // stream ended and we dont have enough lines, try to match anyway
      this.match();
    }

    callback();
  }
}
