module.exports = {
  reactStrictMode: true,
  serverExternalPackages: ["bcrypt", "sequelize", "pg", "pg-hstore", "sqlite3"],
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};
