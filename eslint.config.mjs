import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

// Native flat configuration avoids the legacy module-resolution patch in
// eslint-config-next 15 while retaining its React, Next and TypeScript rules.
const config = [
  {ignores: [".next/**", "out/**", "dist/**", ".vinext/**", ".wrangler/**", "next-env.d.ts", "work/**", "tmp/**", "outputs/**"]},
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    plugins: {"@next/next": nextPlugin, react, "react-hooks": reactHooks, "jsx-a11y": jsxA11y, import: importPlugin},
    languageOptions: {ecmaVersion: "latest", sourceType: "module", parserOptions: {ecmaFeatures: {jsx: true}}},
    settings: {react: {version: "detect"}},
    rules: {
      ...react.configs.recommended.rules,
      // Keep the classic Hooks checks used by Next 15; compiler-specific rules
      // from newer plugin releases can be adopted separately.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "import/no-anonymous-default-export": "warn",
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-no-target-blank": "off",
      "jsx-a11y/alt-text": ["warn", {elements: ["img"], img: ["Image"]}],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {parser: tsParser},
    plugins: {"@typescript-eslint": tsPlugin},
    rules: {
      ...tsPlugin.configs["eslint-recommended"].overrides[0].rules,
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
    },
  },
];

export default config;
