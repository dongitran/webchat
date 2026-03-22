import rootConfig from "../eslint.config.ts";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  ...rootConfig,
  // Ignore auto-generated files
  { ignores: ["src/routeTree.gen.ts"] },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.ts", "vitest.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // React components conventionally use PascalCase filenames
      "unicorn/filename-case": ["error", { cases: { kebabCase: true, pascalCase: true } }],
      // Readonly props add noise in simple components — disable globally in web
      "sonarjs/prefer-read-only-props": "off",
    },
  },
);
