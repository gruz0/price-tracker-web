const { withSentryConfig } = require('@sentry/nextjs')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  // https://nextjs.org/docs/api-reference/next.config.js/react-strict-mode
  reactStrictMode: true,

  // This will build the project as a standalone app inside the Docker image
  output: 'standalone',

  swcMinify: true,

  sentry: {
    disableServerWebpackPlugin: true,
    disableClientWebpackPlugin: true,
  },
}

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = withSentryConfig(withBundleAnalyzer(nextConfig))
