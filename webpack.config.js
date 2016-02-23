'use strict';

module.exports = {
  entry: './client/js/index.js',
  output: {
    path: 'public/js/',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.sass$/,
        loaders: ['style', 'css', 'sass']
      },
      {
        test: /\.jade$/,
        loaders: ['jade']
      }
    ]
  },
  sassLoader: {
    indentedSyntax: true
  },
  node: {
    fs: 'empty' // needed for term.js
  }
};
