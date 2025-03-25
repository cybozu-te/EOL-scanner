const globals = require("globals");
const unusedImports = require("eslint-plugin-unused-imports");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

const jsRules = {
  quotes: [
    "error",
    "double",
    { avoidEscape: true, allowTemplateLiterals: true },
  ],
  "no-var": ["error"],
  indent: ["error", 2],
  "prefer-const": ["error"],
  semi: ["error", "always"],
  "no-undef": ["error"],
  "no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^js_" },
  ],
  "no-multiple-empty-lines": ["error"],
  "max-statements-per-line": ["error", { max: 1 }],
  "newline-per-chained-call": ["error", { ignoreChainWithDepth: 2 }],
  "max-len": [
    "error",
    {
      tabWidth: 2,
      code: 80,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreComments: true,
      ignoreTemplateLiterals: true,
    },
  ],
};

module.exports = [
  {
    plugins: {
      "unused-imports": unusedImports,
      prettier: eslintPluginPrettierRecommended.plugins.prettier,
      eslintPluginPrettierRecommended,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jquery,
        ...globals.node,
      },
    },
    rules: {
      ...jsRules,
      "prettier/prettier": "error",
    },
    files: ["**/*.js"],
    ignores: ["node_modules"],
  },
];
