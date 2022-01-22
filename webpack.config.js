const path = require('path');

module.exports = {
  entry: {
    main: path.resolve(__dirname, './src/index.js'),
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  output: {
    filename: 'tinySheet.min.js',
    library: 'tinySheet',
    libraryTarget: 'umd',
    globalObject: 'this',
    path: path.resolve(__dirname, 'dist')
  },
};