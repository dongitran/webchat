import rootConfig from "../../eslint.config.ts";
import tseslint from "typescript-eslint";

export default tseslint.config(...rootConfig, {
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["eslint.config.ts"],
      },
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
