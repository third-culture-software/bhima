const {
  src, dest, watch,
} = require('gulp');

const {
  CLIENT_FOLDER,
} = require('./util');

const STATIC_PATHS = [
  'client/src/**/*.html',
  'client/src/{assets,i18n,currency}/**/*',
  '!client/src/i18n/{en,fr}/*.json',
];

// collects all static files from the client (BHIMA src and vendor files)
// and moves them to the build folder, respecting folder structure
/**
 *
 */
function buildStatic() {
  return src(STATIC_PATHS, { encoding : false })
    .pipe(dest(CLIENT_FOLDER));
}

const compile = buildStatic;
exports.watch = () => watch(STATIC_PATHS, compile);
exports.compile = compile;
