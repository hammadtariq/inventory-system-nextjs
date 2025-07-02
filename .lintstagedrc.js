const path = require("path");

module.exports = {
  "**/*.{js,jsx,ts,tsx}": (filenames) => [
    "prettier --write .",
    `next lint --fix --file ${filenames.map((file) => path.relative(process.cwd(), file)).join(" --file ")}`,
  ],
};
