/**
 * Good Monitoring/Loggin Options
 * See https://github.com/hapijs/good for further informations about the configuration
 */
const options = {
  ops: {
    interval: 1000
  },
  reporters: {
    myFileLogReporter: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{ log: '*', response: '*', request: '*', error: '*' }]
    }, {
      module: 'good-console'
    }, {
      module: 'rotating-file-stream',
      args: [
        'webbox.log',
        {
          interval: '1d',
          path: './logs/'
        }
      ]
    }/*,{
      module: 'good-file',
      args: ['./logs/webbox.log']
    }*/],
    myConsoleReporter: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{ log: '*', response: '*', request: '*', error: '*' }]
    }, {
      module: 'good-console'
    }, 'stdout'],
    /*myFileOpsReporter: [{
      module: 'good-squeeze',
      name: 'Squeeze',
      args: [{ ops: '*'}]
    }, {
      module: 'good-squeeze',
      name: 'SafeJson'
    }, {
      module: 'good-file',
      args: ['./logs/webbox_ops.log']
    }],*/
  }
};

module.exports = options;