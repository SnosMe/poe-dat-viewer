/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack')

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/poe-dat-viewer/'
    : '/',
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.APP_VERSION': JSON.stringify(require('./package.json').version)
      })
    ],
    resolve: {
      fallback: {
        path: false,
        fs: false
      }
    }
  },
  chainWebpack: config => config.resolve.symlinks(false)
}
