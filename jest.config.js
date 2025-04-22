module.exports = {
  testEnvironment: "node",
  moduleFileExtensions: ["js", "json", "jsx", "node"],
  testMatch: ["**/__tests__/**/*.test.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
};
