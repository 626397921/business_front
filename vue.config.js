const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    open: true,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        pathRewrite: {}
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        pathRewrite: {}
      }
    }
  },
  configureWebpack: {
    devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
    performance: { hints: false }
  },
  css: {
    sourceMap: false,
    extract: process.env.NODE_ENV === 'production'
  }
})