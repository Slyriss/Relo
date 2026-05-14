import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: ["e2e/**", "playwright-report/**", "test-results/**", ".next/**", "node_modules/**"],
  },
  ...nextVitals,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
