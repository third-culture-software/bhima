/* global agent */
/* eslint-disable no-unused-expressions */

const helpers = require('../helpers');

describe('/finance/entities ', () => {
  const validPatientIdentifier = 'PA.TPA.6';
  const invalidPatientIdentifier = 'XA.TPB.300';
  const validEmployeeIdentifier = 'EM.TE.1266';

  it(`/finance/entities returns a list of financial entities`, () => {
    return agent.get('/finance/entities')
      .then(res => {
        helpers.api.listed(res, 100);
      })
      .catch(helpers.handler);
  });

  it(`/finances/entities finds a single patient (${validPatientIdentifier}) by reference`, () => {
    return agent.get('/finance/entities')
      .query({ text : validPatientIdentifier })
      .then(res => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it(`/finances/entities returns an empty list for invalid identifiers`, () => {
    return agent.get('/finance/entities')
      .query({ text : invalidPatientIdentifier })
      .then(res => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

  it(`/finances/entities finds a single employee (${validEmployeeIdentifier}) by reference`, () => {
    return agent.get('/finance/entities')
      .query({ text : validEmployeeIdentifier })
      .then(res => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it('/finances/entities respects limit query parameters', () => {
    return agent.get('/finance/entities')
      .query({ text : 'PA.T', limit : 3 })
      .then(res => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);

  });
});
