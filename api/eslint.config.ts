import rootConfig from "../eslint.config.ts";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";

export default tseslint.config(
  ...rootConfig,
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
  security.configs.recommended,
);
