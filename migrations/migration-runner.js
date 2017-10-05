require('babel-register')({
  'presets': ['es2015', 'react'],
  'plugins': ['transform-object-rest-spread']
});
require('babel-polyfill');

if (process.argv.length <= 2) {
  console.error('Missing argument for migration, e.g. use migration-5');
}

var migration = process.argv[process.argv.length-1];

console.info('Start', migration);
require(`./${migration}`);