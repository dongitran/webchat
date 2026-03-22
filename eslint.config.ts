import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";
import sonarjs from "eslint-plugin-sonarjs";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["**/dist/", "**/node_modules/", "**/coverage/", "**/*.js"],
  },
  {
    files: ["**/eslint.config.ts", "**/vitest.config.ts"],
    rules: {
      "sonarjs/deprecation": "off",
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  prettierConfig,
  {
    plugins: { unicorn },
    rules: {
      ...unicorn.configs.recommended.rules,
      "no-console": "error",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-null": "off",
      "unicorn/prefer-top-level-await": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
