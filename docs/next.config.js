/** @type {import('next').NextConfig} */
const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.jsx",
});

module.exports = withNextra({
  i18n: {
    locales: ["en-US", "ja-JP"],
    defaultLocale: "ja-JP",
  },
});
