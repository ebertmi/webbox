/* global __dirname */

'use strict';

const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  //stats: 'errors-only',
  stats: {
    assets: false,
    children: false,
    // Add chunk information (setting this to `false` allows for a less verbose output)
    chunks: false,
    // Add built modules information to chunk information
    chunkModules: false,
    // Add the origins of chunks and chunk merging info
    chunkOrigins: false,
    entrypoints: false,
    modules: true,
    publicPath: false,
    reasons: false,
    warnings: false,
  },
  mode: 'development',
  target: 'web',
  context: path.join(__dirname, 'client'),
  entry: {
    dashboard: './js/dashboard.js',
    index: './js/index.js',
    embed: './js/embed.js',
    notebook: './js/notebook.js',
    presentation: './js/presentation.js',
  },
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[id].bundle.js',
    path: path.join(__dirname, '/public/js'),
    publicPath: '/public/js/'
  },
  resolve: {
    extensions: ['.js', '.scss'],
    modules: ['client', 'node_modules']
  },
  externals: {
    'highlight.js': 'hljs',
    'markdown-it': 'markdownit',
    'katex': 'katex',
    /*'d3': 'd3'*/
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          // We explicitly include all directory, otherwise, this will break
          // as 'exclude' has a higher priority than include
          path.join(__dirname, 'common'),
          path.join(__dirname, 'client'),

          // Add all npm modules that need to be transpiled!
          // Include xterm module
          ///\bxterm\b/,
        ],
        loader: 'babel-loader',
        query: {
          presets: [['@babel/preset-env', { modules: false }], '@babel/preset-react'],
          plugins: [
            'emotion',
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-object-rest-spread',
            // Stage 2
            ['@babel/plugin-proposal-decorators', { 'legacy': true }],
            '@babel/plugin-proposal-export-namespace-from',
            '@babel/plugin-proposal-throw-expressions',
            // Stage 3
            '@babel/plugin-syntax-dynamic-import',
            '@babel/plugin-syntax-import-meta',
            ['@babel/plugin-proposal-class-properties', { 'loose': false }],
            '@babel/plugin-proposal-json-strings'
          ]
        },
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { importLoaders: 1 }
          },
          {
            loader: 'postcss-loader',
            options: {
              config: {
                path: path.resolve(__dirname, 'postcss.config.js'),
              },
            }
          },
          'sass-loader'
        ]
      },
      {
        // Do not transform vendor's CSS with CSS-modules
        // The point is that they remain in global scope.
        // Since we require these CSS files in our JS or CSS files,
        // they will be a part of our compilation either way.
        // So, no need for ExtractTextPlugin here.
        test: /\.css$/,
        include: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ],
    noParse: [
      /acorn\/dist\/acorn\.js$/,
      /xterm\/lib\/.*$/
    ]
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('development')
      }
    }),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'common/components/presentation/theme/theme.css'),
        to: '../css/spectacle.css',
        copyUnmodified: true
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: '../node_modules/monaco-editor/min/vs',
        to: 'vs',
      }
    ]),
    /*new webpack.optimize.ModuleConcatenationPlugin()*/
    /*new webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
      include: ['presentation.bundle.js', 'index.bundle.js', 'react-commons.bundle.js', 'dashboard.bundle.js'],
      exclude: [],
      columns: false
    }),*/
    //new BundleAnalyzerPlugin()
  ],
  optimization: {
    namedModules: true,
    splitChunks: {
      name: 'commons',
      minChunks: 2
    },
    noEmitOnErrors: true,
    concatenateModules: true
  },
  node: {
    Buffer: true,
    fs: 'empty' // needed for term.js
  },
  devtool: 'source-map'
};
