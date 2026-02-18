const path = require("path");

module.exports = {
  "**/*.{js,jsx,ts,tsx}": (filenames) => [
    "prettier --write .",
    `eslint ${filenames.map((file) => path.relative(process.cwd(), file)).join(" ")}`,
  ],
};
