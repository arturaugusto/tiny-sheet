const path = require('path');

module.exports = {
  entry: {
    main: path.resolve(__dirname, './src/index.js'),
  },
  mode: 'production',
  output: {
    filename: 'main.js',
    libraryTarget: 'umd',
    globalObject: 'this',    
    path: path.resolve(__dirname, 'dist')
  },
};