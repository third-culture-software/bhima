const js = require('@eslint/js');
const { fixupPluginRules } = require('@eslint/compat');
const globals = require('globals');
const { defineConfig } = require('eslint/config');
const jsdoc = require('eslint-plugin-jsdoc');
const eslintPluginYouDontNeedLodashUnderscore = require('eslint-plugin-you-dont-need-lodash-underscore');

const mochaGlobals = {
  describe : "readonly",
  it : "readonly",
  expect : "readonly",
  agent : "writable",
  before : "readonly",
  beforeEach : "readonly",
  after: "readonly",
  $: "readonly",
  afterEach: "readonly",
  context : "readonly"
};


const angularGlobals= {
  angular: "readonly",
}

module.exports = defineConfig([
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  { 
    files: ['**/*.{js,mjs,cjs}'],
    extends: ['js/recommended'],
    plugins: {
      js,
      jsdoc,
      'you-dont-need-lodash-underscore': fixupPluginRules(eslintPluginYouDontNeedLodashUnderscore),
    },
    rules: {
      ...eslintPluginYouDontNeedLodashUnderscore.configs.compatible.rules,
    },
    languageOptions: { globals: {...globals.browser, ...globals.node, ...mochaGlobals, ...angularGlobals } }
  },
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
]);
