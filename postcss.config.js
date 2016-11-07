var autoprefixer = require('autoprefixer');

module.exports = {
  plugins: function () {
    return [ autoprefixer({ browsers: ['last 2 versions'] }) ];
  }
};