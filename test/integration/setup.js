/**
 * @file setup
 * @description
 * This file runs before all other mocha tests, attaching global variables used in tests.
 * @requires chai
 * @requires chai-http
 * @requires chai-datetime
 */

// import plugins
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiDatetime = require('chai-datetime');

const app = require('../../bin/server/app');

// runs before any integration tests
before(async () => {
  console.log('Setting up test suite...');

  // attach plugins
  chai.use(chaiHttp);
  chai.use(chaiDatetime);

  const httpServer = await app.start({ port: 0 });

  // set global variables
  global.chai = chai;
  global.expect = chai.expect;
  global.agent = chai.request.agent(httpServer);
  global.baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
  const { agent } = global;

  // base user defined in test data
  const user = { username : 'superuser', password : 'superuser', project : 1 };

  // trigger login
  return agent.post('/auth/login').send(user);
});

// runs after all tests are completed
after(async () => {
  console.log('Test suite completed.');
  await global.agent.close();
});
