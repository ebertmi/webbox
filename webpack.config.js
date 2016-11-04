/* global __dirname */

'use strict';

var webpack = require('webpack');
var path = require('path');
var autoprefixer = require('autoprefixer');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

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
    extensions: ['.js', '.scss'],
    modules: ['client', 'node_modules']
  },
  externals: {
    "ace": true,
    'highlight.js': 'hljs',
    'markdown-it': 'markdownit',
    'katex': 'katex',
    'd3': true
  },
  module: {
    rules: [
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
          presets: [['es2015', { modules: false }], 'react'],
          plugins: ["transform-object-rest-spread"]
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style',
          {
            loader: 'css-loader',
            options: { importLoaders: 1 }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: function () {
                return [ autoprefixer({ browsers: ['last 2 versions'] }) ];
              }
            }
          },
          'sass'
        ]
      },
      {
        test: /\.json$/,
        loader: "json"
      }
    ],
    noParse: [
      /acorn\/dist\/acorn\.js$/,
      ///xterm.js$/
    ]
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'react-commons',
      chunks: ['dashboard', 'embed', 'notebook', 'presentation']
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development')
      }
    }),
    /*new webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
      include: ['presentation.bundle.js', 'index.bundle.js', 'react-commons.bundle.js', 'dashboard.bundle.js'],
      exclude: [],
      columns: false
    }),*/
    //new BundleAnalyzerPlugin()
  ],
  node: {
    Buffer: true,
    fs: 'empty' // needed for term.js
  },
  devtool: "eval-inline-source-map"
};
