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
let httpServer;

// runs before any integration tests
before(async function () {
  console.log('Setting up test suite...');

  // attach plugins
  chai.use(chaiHttp);
  chai.use(chaiDatetime);

  httpServer = await app.start({ port: 0 });
  global.baseURL = `http://localhost:${httpServer.address().port}`;
  this.baseUrl = global.baseURL;

  // set global variables
  global.chai = chai;
  global.expect = chai.expect;
  global.agent = chai.request.agent(httpServer);
  const { agent } = global;

  // base user defined in test data
  const user = { username : 'superuser', password : 'superuser', project : 1 };

  // trigger login
  return agent.post('/auth/login').send(user);
});

// runs after all tests are completed
after(async () => {
  console.log('Test suite completed.');
  await app.stop(httpServer);
  await global.agent.close();
});
