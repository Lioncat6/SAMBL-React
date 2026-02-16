const { version } = require('./package.json');

module.exports = {
  useFileSystemPublicRoutes: true,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
}