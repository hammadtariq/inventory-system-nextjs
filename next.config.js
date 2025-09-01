/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,

  // Reduce parallelism (you already saw "cpus: 1"—keep it)
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  // <- Key change: stop scanning thousands of files
  outputFileTracing: false,
};
