module.exports = {
  reactStrictMode: true,
  serverExternalPackages: ["bcrypt", "sequelize", "pg", "pg-hstore", "sqlite3"],
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const serverOnlyPackages = ["sequelize", "pg", "pg-hstore", "pg-native", "bcrypt", "sqlite3"];
      const existing = Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean);
      config.externals = [...existing, ...serverOnlyPackages];
    }
    return config;
  },
};
