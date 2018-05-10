/**
 * Producation Webpack Configuration file.
 *
 * Some notes:
 *  - production outputs
 */

/* global __dirname */

const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const autoprefixer = require('autoprefixer');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

process.env.NODE_ENV = '"production"';
const VERSION = require('./package.json').version;
console.info('Building with package version:', VERSION);

module.exports = {
  target: 'web',
  context: path.join(__dirname, 'client'),
  entry: {
    dashboard: './js/dashboard.js',
    index: './js/index.js',
    embed: './js/embed.js',
    notebook: './js/notebook.js',
    presentation: './js/presentation.js'
  },
  output: {
    filename: '[name].bundle.' + VERSION + '.js',
    chunkFilename: '[id].bundle.' + VERSION + '.js',
    path: path.join(__dirname, '/public/js'),
    publicPath: '/public/js/'
  },
  resolve: {
    extensions: ['.js', '.scss'],
    modules: ['client', 'node_modules']
  },
  externals: {
    ace: 'ace',
    'highlight.js': 'hljs',
    'markdown-it': 'markdownit',
    'katex': 'katex'
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
          presets: [['es2015', { modules: false }], 'react', 'stage-2', 'stage-3'],
          plugins: ['transform-runtime', 'syntax-dynamic-import', 'emotion']
        }
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
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
        })
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
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
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
      name: 'commons',
      chunks: ['dashboard', 'embed', 'notebook', 'presentation'],
      minChunks: 2
    }),
    new ExtractTextPlugin({
      filename: '../css/all.bundle.' + VERSION + '.css',
      allChunks: true,
    }),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'common/components/presentation/theme/theme.css'),
        to: '../css/spectacle.css',
        copyUnmodified: true
      }
    ]),
    //new BundleAnalyzerPlugin()
  ],
  node: {
    Buffer: true,
    fs: 'empty' // needed for xterm.js
  },
  //devtool: '#source-map'
};
