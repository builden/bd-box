import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const jsFiles = ["**/src/**/*.{js,mjs}"];
const tsFiles = ["**/src/**/*.{ts,tsx}"];
const jsxFiles = ["**/src/**/*.{tsx,jsx}"];

const ignorePatterns = [
  "**/.dumi/**",
  "**/.dumi/**/*",
  "**/docs/examples/**",
  "**/dist/**",
  "**/node_modules/**",
  "**/*.d.ts",
  "**/tests/**",
  "**/__tests__/**",
  "**/*.test.ts",
  "**/build/**",
];

export default defineConfig([
  {
    ignores: ignorePatterns,
  },
  {
    files: jsFiles,
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, tinycolor: "readonly" },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "no-console": "off",
      "no-undef": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: tsFiles,
    plugins: { "@typescript-eslint": tseslint.plugin },
    extends: [tseslint.configs.strict],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      // Custom overrides
      "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
    },
  },
  {
    files: jsxFiles,
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react-hooks/exhaustive-deps": "off",
    },
  },
]);
