/**
 * Producation Webpack Configuration file.
 *
 * Some notes:
 *  - production outputs
 */

/* global __dirname */

var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var CopyWebpackPlugin = require('copy-webpack-plugin');
var autoprefixer = require('autoprefixer');

process.env.NODE_ENV = '"production"';
var VERSION = require('./package.json').version;
console.info('Building with package version:', VERSION);

module.exports = {
  target: 'web',
  context: path.resolve(__dirname, 'client'),
  entry: {
    dashboard: './js/dashboard.js',
    index: './js/index.js',
    embed: './js/embed.js',
    notebook: './js/notebook.js',
    presentation: './js/presentation.js'
  },
  output: {
    filename: '[name].bundle.' + VERSION + '.js',
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
    'katex': 'katex'
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
          ///\bxterm\b/,
        ],
        loader: 'babel-loader',
        query: {
          presets: ["es2015", 'react'],
          plugins: ["transform-object-rest-spread"]
        }
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', 'css!postcss!sass')
      },
      {
        test: /\.json$/,
        loader: "json"
      }
    ],
    noParse: [
      /acorn\/dist\/acorn\.js$/,
      /xterm.js$/
    ]
  },
  postcss: [ autoprefixer({ browsers: ['last 3 versions'] }) ],
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    }),
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
    new webpack.optimize.CommonsChunkPlugin({
      name: 'react-commons',
      chunks: ['dashboard', 'embed', 'notebook', 'presentation']
    }),
    new ExtractTextPlugin('../css/all.bundle.' + VERSION + '.css', {
      allChunks: true,
      disable: false
    }),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'common/components/presentation/theme/theme.css'),
        to: '../css/spectacle.css',
        copyUnmodified: true
      }
    ])
  ],
  node: {
    Buffer: true,
    fs: 'empty' // needed for xterm.js
  },
};
