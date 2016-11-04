/* global __dirname */
// see http://stackoverflow.com/questions/32385219/mocha-tests-dont-run-with-webpack-and-mocha-loader

var webpack = require('webpack');
var path = require('path');
module.exports = {
  entry: './test-client/all.js',
  output: {
    filename: 'test.build.js',
    path: 'test-client/',
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
          path.resolve(__dirname, 'test-client'),

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
        use: ['style', 'css?-url', 'postcss', 'sass']
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
    new webpack.ContextReplacementPlugin(/^\.\/locale$/, context => {
      // check if the context was created inside the moment package
      if (!/\/moment\//.test(context.context)) {
        return;
      }
      // context needs to be modified in place
      Object.assign(context, {
        // include only german variants
        // all tests are prefixed with './' so this must be part of the regExp
        // the default regExp includes everything; /^$/ could be used to include nothing
        regExp: /^\.\/(de)/,
        // point to the locale data folder relative to moment/src/lib/locale
        request: '../../locale'
      });
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
  devtool: 'inline-source-map'
};
