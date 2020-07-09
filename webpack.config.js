const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    bundle: ['./src/app.js']
  },
  output: {
    path: __dirname + '/public',
    filename: 'app.js'
  },
  module: {
    rules: [
      {
        test: /\.bpmn$/,
        use: 'raw-loader'
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'assets/**', to: 'vendor/bpmn-js', context: 'node_modules/bpmn-js/dist/' },
      { from: '**/*.{html,css}', context: 'src/' }
    ])
  ],
  mode: 'development',
  devtool: 'source-map'
};