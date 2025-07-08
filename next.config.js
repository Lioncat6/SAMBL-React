const { version } = require('./package.json');

module.exports = {
  useFileSystemPublicRoutes: true,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  publicRuntimeConfig: {
    version,
    masondonUrl: process.env.NEXT_PUBLIC_MASTODON_URL
  },
}