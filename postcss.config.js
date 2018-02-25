var autoprefixer = require('autoprefixer');

/*module.exports = {
  plugins: function () {
    return [ autoprefixer({ browsers: ['last 2 versions'] }) ];
  }
};*/

module.exports = {
  plugins: {
    autoprefixer: { browsers: ['last 2 versions', 'iOS >= 10'] }
  },
};