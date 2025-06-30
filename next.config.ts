const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  sw: "sw-custom.js",
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

const nextConfig = {
  experimental: {
    // Enable experimental features if needed
  },
  async headers() {
    return [
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'production' 
              ? 'public, max-age=3600, stale-while-revalidate=86400'
              : 'no-store'
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
