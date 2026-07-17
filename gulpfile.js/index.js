const {
  src, dest, series, parallel,
} = require('gulp');

const { readFileSync } = require('fs');

const { default: template } = require('gulp-template');
const {default: revRewrite} = require('gulp-rev-rewrite');
const mergeJson = require('gulp-merge-json');

// child process for custom scripts
const server = require('./server');
const css = require('./client-css');
const js = require('./client-js');
const vendor = require('./client-vendor');
const buildStatic = require('./client-static');
const fonts = require('./client-fonts');
const i18n = require('./client-i18n');

const {
  isProduction,
  isDevelopment,
  CLIENT_FOLDER,
} = require('./util');

// eslint-disable-next-line
function collectRevisionsIntoManifest(cb) {
  if (isProduction) {
    return src(`${CLIENT_FOLDER}/rev-manifest-*.json`)
      .pipe(mergeJson({ fileName : 'rev-manifest.json' }))
      .pipe(dest(CLIENT_FOLDER));
  }

  cb();
}

// rewrite source HTML files with build versioned files and assets
// usually run as the final step linking the build together
/**
 *
 */
function templateHTMLForProduction() {
  const manifest = readFileSync(`${CLIENT_FOLDER}/rev-manifest.json`);
  return src('client/src/index.html')
    .pipe(template({ isProduction, isDevelopment }))
    .pipe(revRewrite({ manifest }))
    .pipe(dest(CLIENT_FOLDER));
}

/**
 *
 */
function templateHTMLForDevelopment() {
  return src('client/src/index.html')
    .pipe(template({ isProduction, isDevelopment }))
    .pipe(dest(CLIENT_FOLDER));
}

const templateHTML = isProduction
  ? templateHTMLForProduction
  : templateHTMLForDevelopment;

const client = series(
  parallel(js.compile, css.compile, i18n.compile, vendor, buildStatic.compile, fonts),
  collectRevisionsIntoManifest,
  templateHTML,
);

const build = parallel(client, server);

const watch = () => {
  js.watch();
  css.watch();
  buildStatic.watch();
  i18n.watch();
};

exports.default = build;
exports.build = build;
exports.client = client;
exports.server = server;
exports.watch = watch;
