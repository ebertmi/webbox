/**
 * Good Monitoring/Loggin Options
 * See https://github.com/hapijs/good for further informations about the configuration
 */
const goodOptions = {
  ops: {
    interval: 1000
  },
  reporters: {
    console: [{
      module: 'good-console',
      args: [{log: '*', response: '*', error: '*', request: 'error'}]
    }],
    file: [{
      module: 'good-file',
      args: ['./logs/good.log', {log: '*', error: '*', ops: 'error'}]
    }]
  }
};

module.exports = goodOptions;