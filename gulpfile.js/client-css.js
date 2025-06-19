/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const gulpif = require('gulp-if');
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const gulpLess = require('gulp-less');
const concat = require('gulp-concat');
const del = require('del');
const rev = require('gulp-rev');

const {
  src, dest, series, watch,
} = require('gulp');

const {
  isProduction,
  isDevelopment,
  CLIENT_FOLDER,
} = require('./util');

// paths to CSS required by different libraries
let CSS_PATHS = [
  'client/src/css/*.css',
  'node_modules/ui-select/dist/select.min.css',
  'node_modules/angular-ui-grid/ui-grid.min.css',
  'node_modules/font-awesome/css/font-awesome.min.css',
  'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-csp.css',
];

// only minify if in production mode
if (isDevelopment) {
  CSS_PATHS = CSS_PATHS.map(file => file.replace('.min.css', '.css'));
}

const LESS_CONFIG = {
  paths : [
    path.resolve(__dirname, '../node_modules/bootstrap/less/'),
    path.resolve(__dirname, '../client/src/less/'),
  ],
};

const LESS_PATH = 'client/src/less/bhima-bootstrap.less';

/**
 * @function cleanCSS
 *
 * @description
 * Removes previous CSS builds before beginning a new one.
 */
const cleanCSS = () => del(`${CLIENT_FOLDER}/css/bhima`);

/**
 * @function compileCSSForProduction
 *
 * @description
 * Reads the css from the disk, compiles it, minifies it, and computes
 * revisions so that it can bust the previous cache.
 */
function compileCSSForProduction() {
  return src(CSS_PATHS)
    .pipe(concat('css/bhima.min.css'))
    .pipe(postcss([cssnano({ zindex : false })]))
    .pipe(rev())
    .pipe(dest(CLIENT_FOLDER))
    .pipe(rev.manifest('rev-manifest-css.json'))
    .pipe(dest(CLIENT_FOLDER));
}

/**
 * @function compileCSSForDevelopment
 *
 * @description
 * Reads CSS from the disk and combines it into a single file, forgoing
 * minification or other treatments.
 */
function compileCSSForDevelopment() {
  return src(CSS_PATHS)
    .pipe(concat('css/bhima.min.css'))
    .pipe(dest(CLIENT_FOLDER));
}

// toggle the compilation function, depending on if we are in production
// or development mode.
const compileCSS = isProduction
  ? compileCSSForProduction
  : compileCSSForDevelopment;

/**
 * @function compileLess
 *
 * @description
 * Copiles the less paths into CSS file.  Must be called
 * before the CSS compilation step.
 */
function compileLess() {
  return src(LESS_PATH)
    .pipe(gulpLess(LESS_CONFIG))
    .pipe(gulpif(isProduction, postcss([cssnano({ zindex : false })])))
    .pipe(dest(`${CLIENT_FOLDER}/css`));
}

const PATHS = [...CSS_PATHS, LESS_PATH];

const compile = series(cleanCSS, compileLess, compileCSS);
exports.watch = () => watch(PATHS, compile);
exports.compile = compile;
