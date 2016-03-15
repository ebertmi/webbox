/* global __dirname */

'use strict';

var webpack = require('webpack');
var path = require('path');

var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.bundle.js');

module.exports = {
  context: path.resolve(__dirname, 'client'),
  entry: {
    dashboard: './js/dashboard.js',
    index: './js/index',
    embed: './js/embed',
    course: './js/course'
  },
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[id].bundle.js',
    path: __dirname + '/public/js'
  },
  resolve: {
    extensions: ['', '.js', '.scss'],
    modulesDirectories: ['client', 'node_modules']
  },
  externals: {
    ace: true
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react'],
          plugins: ["transform-object-rest-spread"]
        }
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css?-url', 'sass']
      }
    ]
  },
  plugins: [commonsPlugin],
  node: {
    Buffer: true,
    fs: 'empty' // needed for term.js
  },
  devtool: 'source-map'
};
