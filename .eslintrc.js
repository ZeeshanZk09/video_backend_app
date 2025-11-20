module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-var-requires": "off",
    "no-console": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-empty-function": "off",
  },
};
