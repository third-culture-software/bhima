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
const chaiDatetime = require('chai-datetime');

// server
const server = require('../../bin/server/app');

// runs before any tests in the repository
before(() => {
  console.log('Setting up test suite...');  

  // attach plugins
  chai.use(chaiHttp);
  chai.use(chaiDatetime);

  // set global variables
  global.chai = chai;
  global.expect = chai.expect;
  global.agent = chai.request.agent(server);
  const { agent } = global;

  // base user defined in test data
  const user = { username : 'superuser', password : 'superuser', project : 1 };

  // trigger login
  return agent.post('/auth/login').send(user);
});

beforeEach(function anonymous(done) {
  this.timeout(10000);
  done();
});

// runs after all tests are completed
after((done) => {
  console.log('Test suite completed.');  
  global.agent.close((err) => { done(err); });
});
