import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".claude/**",
      "glidego-tests/**"
    ]
  }
];

export default config;
