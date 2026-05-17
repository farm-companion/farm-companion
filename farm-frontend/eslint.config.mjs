// rationale: Direct flat-config imports replace FlatCompat bridge — FlatCompat
// circularly serialises next-plugin under @eslint/eslintrc 3.3.3 + ESLint 9.39.
// eslint-config-next 16.1.6 already exports flat-config-shaped arrays.

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // Mirrors CLAUDE.md "File size rules" — warns at hard threshold (500 LOC).
      "max-lines": ["warn", { max: 500, skipBlankLines: false, skipComments: false }],
    },
  },
  // File-size carve-outs (mirror CLAUDE.md "File size rules")
  {
    files: ["src/data/**", "**/*.config.{ts,js,mjs}", "**/*.d.ts"],
    rules: { "max-lines": "off" },
  },
  // Tests get 2x the source limit (1000 LOC)
  {
    files: ["**/*.test.{ts,tsx,js}", "**/*.spec.{ts,tsx,js}", "**/tests/**"],
    rules: {
      "max-lines": ["warn", { max: 1000, skipBlankLines: false, skipComments: false }],
    },
  },
];

export default eslintConfig;
