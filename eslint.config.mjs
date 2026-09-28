import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: pluginReact,
    },
    rules: {
    "@typescript-eslint/no-unused-vars": "error",
    "no-unused-vars": "error",
    "no-unused-expressions":"error",
    "prefer-const":"error",
    "no-console": "warn",
    "no-undef": "error",
    },
    
  },
];