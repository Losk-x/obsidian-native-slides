// ESLint flat config (ESLint 9)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "**/main.js", // generated build artifact (incl. example-vault symlink)
      "node_modules/**",
      ".npm-cache/**",
      "package-lock.json",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier, // disable style rules handled by Prettier
);
