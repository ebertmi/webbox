/* global __dirname */

'use strict';

var webpack = require('webpack');
var path = require('path');
var autoprefixer = require('autoprefixer');

module.exports = {
  context: path.resolve(__dirname, 'client'),
  entry: {
    dashboard: './js/dashboard.js',
    index: './js/index.js',
    embed: './js/embed.js',
    notebook: './js/notebook.js',
    presentation: './js/presentation'
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
    ace: true,
    'highlight.js': 'hljs',
    'markdown-it': 'markdownit',
    'katex': 'katex',
    'd3': true
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [
          // We explicitly include all directory, otherwise, this will break
          // as 'exclude' has a higher priority than include
          path.resolve(__dirname, 'common'),
          path.resolve(__dirname, 'client'),

          // Add all npm modules that need to be transpiled!
          // Include xterm module
          /\bxterm\b/,
        ],
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react'],
          plugins: ["transform-object-rest-spread"]
        }
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css?-url', 'postcss', 'sass']
      },
      {
        test: /\.json$/,
        loader: "json"
      }
    ],
    noParse: [
      /acorn\/dist\/acorn\.js$/,
    ]
  },
  postcss: [ autoprefixer({ browsers: ['last 2 versions'] }) ],
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'react-commons',
      chunks: ['dashboard', 'embed', 'notebook', 'presentation']
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development')
      }
    })
  ],
  node: {
    Buffer: true,
    fs: 'empty' // needed for term.js
  },
  devtool: 'source-map'
};
