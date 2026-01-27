import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // Consistent type imports - disabled for now as it's noisy on generated UI components
      "@typescript-eslint/consistent-type-imports": "off",
      // Code quality rules
      // no-console: disabled as dev logs are wrapped in import.meta.env.DEV checks
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      // Prevent deprecated methods
      "no-restricted-properties": [
        "error",
        {
          object: "String",
          property: "substr",
          message: "Use String.prototype.slice() or substring() instead.",
        },
      ],
    },
  },
  // Shadcn-style UI primitives often export variants/helpers alongside components.
  // Disable this rule for those files to keep lint output clean.
  {
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/components/AchievementDisplay.tsx",
      "src/context/settings-context.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // Disable refs during render for use-game-logic.ts as it's a complex hook with refs
  {
    files: ["src/hooks/use-game-logic.ts"],
    rules: {
      "react-hooks/refs": "off",
    },
  },
);
