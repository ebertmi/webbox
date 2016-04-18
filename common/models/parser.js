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

export default class RegexParser extends Transform  {
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
