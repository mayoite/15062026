import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import tsEslint from "typescript-eslint";

const REACT_PLUGIN_COMPAT_RULES = Object.fromEntries([
  "react/display-name",
  "react/jsx-key",
  "react/jsx-no-comment-textnodes",
  "react/jsx-no-duplicate-props",
  "react/jsx-no-target-blank",
  "react/jsx-no-undef",
  "react/jsx-uses-react",
  "react/jsx-uses-vars",
  "react/no-children-prop",
  "react/no-danger-with-children",
  "react/no-deprecated",
  "react/no-direct-mutation-state",
  "react/no-find-dom-node",
  "react/no-is-mounted",
  "react/no-render-return-value",
  "react/no-string-refs",
  "react/no-unescaped-entities",
  "react/no-unknown-property",
  "react/no-unsafe",
  "react/prop-types",
  "react/react-in-jsx-scope",
  "react/require-render-return",
].map((rule) => [rule, "off"]));

export default tsEslint.config(
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  ...nextVitals,
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/.codex-runtime/**",
      "**/config/environment/next-env.d.ts",
      "**/oando_assets/**",
      "**/.lh-*/**",
      "**/.vercel/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/coverage/**",
      "**/results/**",
      "**/features/ops-portal/dist/**",
      "**/.swc/**",
      "**/logs/**",
      "**/backup/**",
      "**/docs/**",
      "**/project/**",
      "**/supabase/.temp/**",
      "**/*.rej",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      ...REACT_PLUGIN_COMPAT_RULES,

      // STRICT TYPESCRIPT
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-require-imports": "error",

      // STRICT REACT & NEXT.JS
      "react-hooks/exhaustive-deps": "error",
      "@next/next/no-img-element": "error",

      // STRICT JAVASCRIPT
      "no-console": ["error", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],
    },
  },
  {
    // RELAXED RULES FOR TESTS ONLY
    files: ["tests/**/*.{ts,tsx}", "**/__mocks__/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly"
      }
    }
  }
);
