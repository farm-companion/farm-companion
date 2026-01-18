import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tailwind from "eslint-plugin-tailwindcss";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...tailwind.configs["flat/recommended"],
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // Tailwind CSS rules for design system enforcement
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-custom-classname": "off", // Allow semantic tokens
      "tailwindcss/no-contradicting-classname": "error",
    },
  },
];

export default eslintConfig;
