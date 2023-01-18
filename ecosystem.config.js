module.exports = {
  apps: [
    {
      name: "app1",
      script: "yarn dev",
      watch: ".",
      env_production: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
        POSTGRES_DB: "inventory-management-local",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        TOKEN_SECRET: "this-is-minimum-32-chars-long-token-1xs3%w-s32mf-2342k&8",
      },
    },
  ],

  deploy: {
    production: {
      POSTGRES_DB: "inventory-management-local",
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "postgres",
      TOKEN_SECRET: "this-is-minimum-32-chars-long-token-1xs3%w-s32mf-2342k&8",
      user: "SSH_USERNAME",
      host: "SSH_HOSTMACHINE",
      ref: "origin/master",
      repo: "GIT_REPOSITORY",
      path: "DESTINATION_PATH",
      "pre-deploy-local": "",
      "post-deploy": "npm install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};
