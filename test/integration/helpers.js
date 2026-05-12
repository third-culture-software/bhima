 

// import plugins
const { randomUUID } = require('node:crypto');
const { expect } = require('chai');

/**
 * Clones the object and removes the field, to test if the field is required
 * and the server error codes
 * @param {object} object - any valid JS object
 * @param {string} field - a key on the passed in object
 * @returns {object} clone - the copied object missing the propertay
 */
exports.mask = function mask(object, field) {
  const clone = structuredClone(object);
  delete clone[field];
  return clone;
};

// generic error handler
exports.handler = function handler(err) {
  throw err;
};

/* bindings for API-specific response tests */
exports.api = {};
const { api } = exports;

/* ensure that objectA's key/values are contained in and identical to objectB's */
exports.identical = function identical(objectA, objectB) {
  return Object.keys(objectA).every((key) => {
    return objectA[key] === objectB[key];
  });
};

/**
 * Ensures that a create API request has returned the expected results for
 * further API usage.
 * @function created
 * @param {object} res - the HTTP response object
 * @example
 * var helpers = require('path/to/helpers.js');
 * var obj = { name : 'xyz', timestamp : new Date() }
 * agent.post('some/route')
 * .send(obj)
 * .then(function (res) {
 *   helpers.api.created(res);
 *
 *   // do something useful with the response, like further tests
 * })
 * .catch(helpers.handler);
 */
api.created = function created(res) {

  // make sure the response has correct HTTP headers
  expect(res).to.have.status(201);
  expect(res).to.be.json;

  // ensure that we received a correct uuid in return
  expect(res.body, `${res.req.method} ${res.req.path} returned an empty body.`).to.not.be.empty;

  // make sure that we either have a UUID or an ID
  expect(res.body, `${res.req.method} ${res.req.path} did not return an id or uuid.`).to.satisfy(o => o.id || o.uuid);

  // id checks
  if (res.body.id) {
    expect(res.body.id, `${res.req.method} ${res.req.path} returned a non-numeric id.`).to.be.a('number');

  // uuid checks
  } else {
    expect(res.body, `${res.req.method} ${res.req.path} returned an invalid uuid.`).to.have.property('uuid');
    expect(res.body.uuid).to.be.a('string');
    expect(res.body.uuid).to.have.length(36);
  }
};

/**
 * Ensures that an API request has properly errored with translatable text.
 * @function errored
 * @param {object} res - the HTTP response object
 * @param {number} status - the appropiate HTTP status
 * @param key
 * @example
 * var helpers = require('path/to/helpers.js');
 * agent.get('some/invalid/id')
 * .then(function (res) {
 *   helpers.api.errored(res);
 * })
 * .catch(helpers.handler);
 */
api.errored = function errored(res, status, key) {
  const keys = ['code'];

  // make sure the response has the correct HTTP headers
  expect(res).to.have.status(status);
  expect(res).to.be.json;

  // the error codes should be sent back
  expect(res.body).to.not.be.empty;
  expect(res.body).to.contain.all.keys(keys);

  // ensure the error properties conform to standards
  expect(res.body.code).to.be.a('string');

  // if a key was passed in, expect that key
  if (key) {
    expect(res.body.code).to.equal(key);
  }
};

/**
 * @description
 * Ensures that an original object has been updated.  Does not support
 * deep equality.
 * @note - this will have some issues with dates.
 * @todo
 * @function updated
 * @param {object} res - the HTTP response object
 * @param {object} original - the virgin object before changes
 * @param {Array} changedKeys - a list of properties expected to change
 * @example
 * agent.get('some/id') // TODO
 */
api.updated = function updated(res, original, changedKeys) {
  // make sure the response has the correct HTTP headers
  expect(res).to.have.status(200);
  expect(res).to.be.json;

  // make sure we received a body
  expect(res.body).to.not.be.empty;

  // loop through the body, asserting that only the correct properties
  // have changed
  Object.keys(res).forEach((key) => {

    // if the key is in "changedKeys", it should not equal the original
    if (changedKeys.indexOf(key) > -1) {
      expect(res.body[key]).to.not.equal(original[key]);
    } else {
      expect(res.body[key]).to.equal(original[key]);
    }
  });
};

/**
 * Ensures that a DELETE API request was successful and conforms to API
 * standards.
 * @function deleted
 * @param {object} res - the HTTP response object
 * @example
 * var helpers = require('path/to/helpers');
 *
 * agent.delete('some/id')
 * .then(function (res) {
 *   helpers.api.deleted(res);
 * })
 * .catch(helpers.handler);
 */
api.deleted = function deleted(res) {
  // make sure that the response has the correct HTTP headers
  expect(res).to.have.status(204);
  expect(res.body, `${res.req.method} ${res.req.path} was not empty.`).to.be.empty;
};

/**
 * Ensures that a GET API request was successful and conforms to API standards.
 * This tests is only for "list" methods, which return an array of records from
 * the database with a 200 success code expected.
 * @function listed
 * @param {object} res - the HTTP response object
 * @param {number} len - the expected length of the array returned
 * @example
 * var helpers = require('path/to/helpers');
 *
 * agent.get('some/route')
 * .then(function (res) {
 *   helpers.api.listed(res, 10);
 * })
 * .catch(helpers.handler);
 */
api.listed = function listed(res, len) {
  // make sure that the response has the correct HTTP headers
  expect(res,
    `${res.req.method} ${res.req.path} returned ${res.res.statusCode} ${res.res.statusMesage}.`).to.have.status(200);
  expect(res, `${res.req.method} ${res.req.path} did not return JSON.`).to.be.json;

  // assert that the length is the expected length.
  expect(res.body, `${res.req.method} ${res.req.path} did not return an array of length ${len}.`).to.have.length(len);
};

/*
 * Data helpers to clarify the code
 */
exports.data = {
  USD : 2,
  FC : 1,
  PROJECT : 1,
  PRICE_LIST : '75e09694-dd5c-11e5-a8a2-6c29955775b0',
  SUPERUSER : 1,
  OTHERUSER : 2,
  DEBTOR_UUID : 'a11e6b7f-fbbb-432e-ac2a-5312a66dccf4',
  QUININE_TEXT : 'Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité',
  QUININE : '43f3decb-fce9-426e-940a-bc2150e62186',
  PARACETEMOL : '6B4825F14E6E47998A81860531281437',
  MULTIVITAMINE : 'f6556e72-9d05-4799-8cbd-0a03b1810185',
  PREDNISONE_TEXT : 'Prednisolone, 0,5%, Solution, Flacon, Unité',
  PREDNISONE : 'C3FD5A026A7549FCB2F376EE4C3FBFB7',
  depots : {
    principal : 'f9caeb16-1684-43c5-a6c4-47dbac1df296',
    secondaire : 'd4bb1452-e4fa-4742-a281-814140246877',
  },
  services : {
    admin : 'B1816006555845F993A0C222B5EFA6CB',
    test : 'aff85bdc-d7c6-4047-afe7-1724f8cd369e',
    medicine_interne : 'E3988489EF6641DF88FA8B8ED6AA03AC',
    newService : '029263E99A29436BB12EE9730A70C515',
    newService2 : '63E9029299A26B43B21EE973051A70C5',
  },
};

exports.uuid = () => randomUUID();
