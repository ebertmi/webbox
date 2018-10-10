/* global __dirname */
// see http://stackoverflow.com/questions/32385219/mocha-tests-dont-run-with-webpack-and-mocha-loader

const webpack = require('webpack');
const path = require('path');
module.exports = {
  entry: './test-client/all.js',
  output: {
    filename: 'test.build.js',
    path: path.join(__dirname, 'test-client/'),
  },
  externals: {
    'highlight.js': 'hljs',
    'markdown-it': 'markdownit',
    'katex': 'katex',
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
          path.join(__dirname, 'test-client'),

          // Add all npm modules that need to be transpiled!
          // Include xterm module
          /\bxterm\b/,
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
        }
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
    noParse: [/acorn\/dist\/acorn\.js$/, /xterm\/lib\/.*$/]
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
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
