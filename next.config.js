const { version } = require('./package.json');

module.exports = {
  useFileSystemPublicRoutes: true,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  publicRuntimeConfig: {
    version,
    mastodonUrl: process.env.NEXT_PUBLIC_MASTODON_URL
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}