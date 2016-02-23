/* global __dirname */
var webpack = require('webpack');

var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');

module.exports = {
  context: __dirname + '/client',
  entry: {
    index: './js/index',
    embed: './js/embed'
  },
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[id].bundle.js',
    path: __dirname + '/public/js'
  },
  loaders: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader",
      query: {
        presets: ['es2015']
      }
    }
  ],
  plugins: [commonsPlugin]
};