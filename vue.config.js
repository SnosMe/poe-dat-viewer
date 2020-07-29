/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack')

module.exports = {
  pluginOptions: {
    quasar: {
      importStrategy: 'manual',
      rtlSupport: false
    }
  },
  transpileDependencies: [
    'quasar'
  ],
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          APP_VERSION: JSON.stringify(require('./package.json').version)
        }
      })
    ]
  }
}
