/* eslint-disable @typescript-eslint/no-require-imports */
const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin(
  // next-intl looks for this file by default; explicit for clarity.
  "./i18n/request.ts"
);

const baseConfig = require("./config/build/next.config.js");

module.exports = withNextIntl(baseConfig);
