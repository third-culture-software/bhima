/* eslint-disable import/no-extraneous-dependencies */
const {
  src, dest,
} = require('gulp');

const concat = require('gulp-concat');
const rev = require('gulp-rev');

const {
  isProduction,
  isDevelopment,
  CLIENT_FOLDER,
} = require('./util');

let VENDOR_FILES = [
  'node_modules/jquery/dist/jquery.min.js', // jquery

  // Angular
  'node_modules/angular/angular.min.js',
  'node_modules/angular-messages/angular-messages.min.js',
  'node_modules/angular-sanitize/angular-sanitize.min.js',
  'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-tpls.js',
  'node_modules/angular-ui-grid/ui-grid.min.js',

  'node_modules/angular-touch/angular-touch.min.js',
  'node_modules/ui-select/dist/select.min.js',

  'node_modules/angular-growl-notifications/dist/angular-growl-notifications.min.js',
  'node_modules/angular-animate/angular-animate.min.js',

  // translations/locales
  'node_modules/angular-translate/dist/angular-translate.min.js',
  'node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
  'node_modules/angular-translate-loader-url/angular-translate-loader-url.min.js',
  'node_modules/angular-dynamic-locale/dist/tmhDynamicLocale.min.js',

  'node_modules/ng-file-upload/dist/ng-file-upload.min.js',

  'node_modules/ngstorage/ngStorage.min.js', // ng-storage
  'node_modules/webcam/dist/webcam.min.js', // webcam directive

  // UI Router
  'node_modules/@uirouter/angularjs/release/angular-ui-router.min.js',

  // MomentJS
  'node_modules/moment/min/moment.min.js',
  'node_modules/moment/locale/fr.js',
  'node_modules/angular-moment/angular-moment.min.js',
];

if (isDevelopment) {
  VENDOR_FILES = VENDOR_FILES.map(file => {
    if (file.includes('angular')) {
      return file.replace('min.js', 'js');
    }

    return file;
  });
}

/**
 * @function buildVendorForProduction
 *
 * @description
 * Uses the already-minified files to concatenate into a single vendor file and
 * writes revisions so that we have a clean slate.
 */
function buildVendorForProduction() {
  return src(VENDOR_FILES)
    .pipe(concat('js/vendor/vendor.min.js'))
    .pipe(rev())
    .pipe(dest(CLIENT_FOLDER))
    .pipe(rev.manifest('rev-manifest-vendor.json'))
    .pipe(dest(CLIENT_FOLDER));
}

/**
 * @function buildVendorForDeveloment
 *
 * @description
 * Combines files into a single output file for development.  It doesn't do any post-processing.
 */
function buildVendorForDevelopment() {
  return src(VENDOR_FILES)
    .pipe(concat('js/vendor/vendor.min.js'))
    .pipe(dest(CLIENT_FOLDER));
}

const buildVendor = isProduction
  ? buildVendorForProduction
  : buildVendorForDevelopment;

module.exports = buildVendor;
