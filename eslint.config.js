const js = require('@eslint/js');
const {  fixupPluginRules } = require('@eslint/compat');
const globals = require('globals');
const { defineConfig } = require("eslint/config");
const eslintPluginYouDontNeedLodashUnderscore = require('eslint-plugin-you-dont-need-lodash-underscore');

module.exports = defineConfig([
  { 
    files: ["**/*.{js,mjs,cjs}"],
    extends: ["js/recommended"],
    plugins: {
      js,
      'you-dont-need-lodash-underscore': fixupPluginRules( eslintPluginYouDontNeedLodashUnderscore),
    },
    rules : {...eslintPluginYouDontNeedLodashUnderscore.configs.compatible.rules},
    languageOptions: { globals: {...globals.browser, ...globals.node} }
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
]);

