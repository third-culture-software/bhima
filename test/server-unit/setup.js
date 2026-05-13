/* eslint global-require:off */

/* global after before */
/**
 * @function setup
 * @description
 * This function will run before every other test suite.  It is responsible for
 * setting up dependencies and environmental variables.  As long as all your
 * imports that need to be configured are in the `before()` or `beforeEach()`
 * calls of the mocha test suite, everything should work exactly the way you
 * expect.
 */
before(() => {
  // configure chai with spies and promises
  const chai = require('chai');
  chai.use(require('chai-as-promised'));
  chai.use(require('chai-spies-next'));

  // load environmental variables
  require('dotenv').config();
});

/**
 * @function teardown
 * @description
 * This function runs after the test suite is complete.  Put any teardown code
 * here.
 */
after(() => {

});
