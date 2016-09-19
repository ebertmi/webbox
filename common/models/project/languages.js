import { RegexParser, PythonErrorParser } from './parser';

// a few default languages

// exec, compile etc. can be array, string or function
// function is called with list of filenames relative to project
// string has $FILES replaced with a list of files and run through a shell
// $MAINFILE is also replaced
// array is left as it is?
//
// if parser is specified compiler output will be parsed!!

const C = {
  compile(files) {
    files = files.filter(file => file.endsWith('.c'));
    return ['gcc', '-lm', '-Wall'].concat(files);
  },
  exec: ['./a.out'],
  parser() {
    return new RegexParser({
      regex: /^(.+):(\d+):(\d+): (?:fatal )?(error|warning|note): (.*)$/,
      labels: ['file', 'row', 'column', 'type', 'text']
    });
  },
  displayName: 'C'
};

const Java = {
  compile: 'javac -Xlint $FILES',
  exec(files, mainFile) {
    let className = mainFile.replace(/\.java$/, '').replace(/\//g, '.');
    return ['java', className];
  },
  parser() {
    return new RegexParser({
      regex: /^(.+):(\d+): (error|warning): (.+)\n.*\n( +)\^$/,
      labels: ['file', 'row', 'type', 'text', 'column'],
      callback: function (matches, labels) {
        labels.column = labels.column.length + 1;
        this.push(labels);
      }
    }, 3);
  },
  displayName: 'Java'
};

const Python3 = {
  exec(files, mainFile='./main.py') {
    return ['python3', mainFile];
  },
  test(fileNames, mainFile, projectName) {
    return ['python3', '/usr/local/lib/sourcebox/tester.py', `/home/user/${projectName}`];
  },
  displayName: 'Python 3',
  env: {
    PYTHONPATH: '/usr/local/lib/sourcebox/',
    MPLBACKEND: 'module://backend_sb',
    MPLCONFIGDIR: '/usr/local/lib/sourcebox/mplconfig'
  },
  streams: 3,
  streamsObjectMode: [false, true, false] /* set the mode for the additional streams */,
  errorParser: new PythonErrorParser()
};

const Python2 = {
  exec(files, mainFile='./main.py') {
    return ['python', mainFile];
  },
  displayName: 'Python 2',
  errorParser: new PythonErrorParser(),
  env: {
    PYTHONPATH: '/usr/local/lib/sourcebox/',
    MPLBACKEND: 'module://backend_sb',
    MPLCONFIGDIR: '/usr/local/lib/sourcebox/mplconfig'
  },
  streams: 3,
  streamsObjectMode: [false, true, false] /* set the mode for the additional streams */,
};

/*
 * Export simple object (dict) containing all mappings for the different versions.
 */
export default {
  c: C,
  c13: C,

  java: Java,
  java7: Java,
  java8: Java,

  // this allows us also to run any commands and configure matplotlib etc
  python3: Python3,

  // this allows us also to run any commands and configure matplotlib etc
  python2: Python2
};
