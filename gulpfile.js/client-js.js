const {
  src, dest, series, watch,
} = require('gulp');

const concat = require('gulp-concat');
const iife = require('gulp-iife');
const typescript = require('gulp-typescript');
const uglify = require('gulp-uglify');
const { default: rev } = require('gulp-rev');
const {deleteAsync}= require('del');

const CLIENT_JS = [
  'client/src/js/define.js',
  'client/src/js/app.js',
  'client/src/**/*.js',
  '!client/src/i18n/**/*.js',
];

const {
  isProduction,
  CLIENT_FOLDER,
} = require('./util');

/**
 * @function cleanJS
 * @description
 * Removes previous JS builds from the client.
 */
const cleanJS = () => deleteAsync([`${CLIENT_FOLDER}/js/bhima`]);

const typescriptConfig = {
  allowJs : true,
  target : 'es5',
  lib : ['es6', 'dom'],
  module : 'none',
  moduleResolution : 'Node',
  outFile : 'js/bhima/bhima.min.js',
};

/**
 * @function compileTypescript
 * @description
 * Collect all BHIMA application code and return a single versioned JS file.
 */
function compileTypescriptForDevelopment() {
  return src(CLIENT_JS)
    .pipe(concat('bhima.concat.js'))
    .pipe(typescript(typescriptConfig))
    .pipe(iife())
    .pipe(dest(CLIENT_FOLDER));
}

/**
 * @function compileTypescriptForProduction
 * @description
 * Collects the JS files and concatenates them together, minifiying, and then writing
 * revisions to disk.
 */
function compileTypescriptForProduction() {
  return src(CLIENT_JS)
    .pipe(concat('bhima.concat.js'))
    .pipe(typescript(typescriptConfig))
    .pipe(uglify({ mangle : true }))
    .pipe(iife())
    .pipe(rev())
    .pipe(dest(CLIENT_FOLDER))
    .pipe(rev.manifest('rev-manifest-js.json'))
    .pipe(dest(CLIENT_FOLDER)); // write manifest to build folder
}

// switch functions depending on the mode
const compileTypescript = isProduction
  ? compileTypescriptForProduction
  : compileTypescriptForDevelopment;

const compile = series(cleanJS, compileTypescript);
exports.watch = () => watch(CLIENT_JS, compile);
exports.compile = compile;
