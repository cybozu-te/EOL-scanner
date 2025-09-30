import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

export default [
  eslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      "@stylistic": stylistic,
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      ecmaVersion: 2024,
      ecmaFeatures: {
        experimentalObjectRestSpread: true
      },
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "prefer-const": "error",
      "no-unused-vars": "off",
      "@stylistic/quotes": [
        "error",
        "double",
        { avoidEscape: true, allowTemplateLiterals: "always" },
      ],
      "@stylistic/indent": ["error", 2],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/no-multiple-empty-lines": ["error"],
      "@stylistic/max-statements-per-line": ["error", { max: 1 }],
      "@stylistic/newline-per-chained-call": [
        "error",
        { ignoreChainWithDepth: 2 },
      ],
      "@stylistic/max-len": [
        "error",
        {
          tabWidth: 2,
          code: 100,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreComments: true,
          ignoreTemplateLiterals: true,
        },
      ],
      "import/no-unresolved": ["error", { ignore: [".*"] }],
      "import/newline-after-import": ["error", { count: 1 }],
      "simple-import-sort/imports": [
        "error",
        {
          groups: [["^#src", "^#scanners"]],
        },
      ],
      "prettier/prettier": "error",
    },
  },
  {
    ignores: ["**/node_modules/*"],
  },
];
