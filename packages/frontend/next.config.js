/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@fusion-ai/common'],
  i18n: {
    // Supporting multi-lingual capabilities as per project requirements
    locales: ['en', 'es', 'zh', 'fr', 'ar'],
    defaultLocale: 'en',
  },
  webpack: (config) => {
    // Add support for importing SVG files as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

module.exports = nextConfig;