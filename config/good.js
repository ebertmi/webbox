var goodConsole = require('good-console');
var goodFile = require('good-file');

var reporters = [{
    reporter: goodConsole,
    events: {log: '*', response: '*', error: '*', request: 'error'}
}, {
    reporter: goodFile,
    events: {log: '*', error: '*', ops: 'error'},
    config: './logs/good.log'
}];

var goodConfig = {
    opsInterval: 1000,
    reporters: reporters
}

module.exports = goodConfig;