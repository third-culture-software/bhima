/**
 * @file setup
 * @description
 * This file runs before all other mocha tests, attaching global variables used in tests.
 * @requires chai
 * @requires q
 * @requires chai-http
 * @requires chai-datetime
 */

// import plugins
const chai = require('chai');
const chaiHttp = require('chai-http');

// server
const server = require('../../bin/server/app');

// runs before any tests in the repository
before(() => {
  console.log('Setting up install test suite...');

  // attach plugins
  chai.use(chaiHttp);

  // set global variables
  global.chai = chai;
  global.expect = chai.expect;
  global.requester = chai.request(server).keepOpen();
});

// runs after all tests are completed
after((done) => {
  console.log('Install test suite completed.');
  global.requester.close((err) => { done(err); });
});
