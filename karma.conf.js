// Karma configuration
// Generated on Wed Mar 30 2016 15:50:28 GMT+0100 (WAT)

module.exports = (config) => {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath : '',

    // frameworks to use
    // available frameworks : https://npmjs.org/browse/keyword/karma-adapter
    frameworks : ['mocha', 'chai-spies', 'chai-dom', 'chai', 'sinon'],

    // list of files / patterns to load in the browser
    files : [
      `bin/client/js/vendor/vendor.min.js`,
      'node_modules/angular-mocks/angular-mocks.js',
      'test/client-unit/mocks/*.js',
      `bin/client/js/bhima/bhima.min.js`,
      'bin/client/modules/**/*.html',
      'bin/client/js/components/**/*.html',
      { pattern : 'bin/client/i18n/locale/*.js', included : false, served : true },
      'test/client-unit/**/*.spec.js',
    ],

    // Karma serves all files out of the route /base/*.  We must make a proxy to
    // intercept these requests and rewrite them to the right place.
    // see : http://karma-runner.github.io/2.0/config/files.html
    proxies : {
      '/i18n/'  : '/base/bin/client/i18n/',
    },

    // list of files to exclude
    exclude : [],

    // preprocess matching files before serving them to the browser
    // available preprocessors : https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors : {
      '**/*.html'  : ['ng-html2js'],
    },

    ngHtml2JsPreprocessor  : {
      stripPrefix  : 'bin/client/',
      moduleName  : 'templates',
    },

    // test results reporter to use
    // possible values : 'dots', 'progress'
    // available reporters : https://npmjs.org/browse/keyword/karma-reporter
    reporters : ['progress', 'junit'],

    // JUnit reporter options
    junitReporter : {
      outputDir : 'results',
      outputFile : process.env.KARMA_FILENAME || 'test.xml',
      suite : 'BHIMA-Tests',
      useBrowserName : false,
      nameFormatter : (browser, result) => {
        return result.description;
      },
      classNameFormatter : (browser, result) => {
        return result.suite[0];
      },
    },

    // web server port
    port : 9876,

    // enable / disable colors in the output (reporters and logs)
    colors : true,

    // level of logging
    // possible values : config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN
    // || config.LOG_INFO || config.LOG_DEBUG
    logLevel : config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch : true,

    // start these browsers
    // available browser launchers : https://npmjs.org/browse/keyword/karma-launcher
    browsers : ['ChromeHeadless'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun : false,

    captureConsole : true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency : 2,
  });
};
