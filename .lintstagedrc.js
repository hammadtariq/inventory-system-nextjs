module.exports = {
  "**/*.js?(x)": (filenames) => [
    "prettier --write .",
    `next lint --fix --file ${filenames.map((file) => file.split(process.cwd())[1]).join(" --file ")}`,
  ],
};
