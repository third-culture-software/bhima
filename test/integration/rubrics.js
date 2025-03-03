/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /payroll/rubrics  API
 *
 * This test suite implements full CRUD on the /payroll/rubrics and the rubrics_config API.
 */
describe('test/integration/rubrics The /payroll/rubrics API', () => {

  const rubric = {
    label : 'Rubric Test',
    abbr : 'RTest',
    is_employee : 1,
    is_percent : 1,
    is_discount : 1,
    is_tax : 1,
    debtor_account_id : 175,
    expense_account_id : 249,
    value : 3.5,
  };

  const rubricUpdate = {
    label : 'Rubric Updated',
  };

  const rubricConfig = {
    label : 'Configuration 2013',
    items : [5, 2, 3, 1, 4],
  };

  const rubricConfigUpdate = {
    label : 'Configuration 2013 Updated',
    items : [5, 2],
  };

  const NUM_RUBRICS = 47;
  const NUM_CONFIG_RUBRICS = 5;

  it('GET /rubrics returns a list of Rubrics ', () => {
    return agent.get('/rubrics')
      .then((res) => {
        helpers.api.listed(res, NUM_RUBRICS);
      })
      .catch(helpers.handler);
  });

  it('POST /rubrics should create a new Rubric', () => {
    return agent.post('/rubrics')
      .send(rubric)
      .then((res) => {
        rubric.id = res.body.id;
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /rubrics/:id send back a 404 if the rubrics id does not exist', () => {
    return agent.get('/rubrics/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /rubrics/:id send back a 404 if the rubrics id is a string', () => {
    return agent.get('/rubrics/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /rubrics  should update an existing Rubric ', () => {
    return agent.put('/rubrics/'.concat(rubric.id))
      .send(rubricUpdate)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal('Rubric Updated');
      })
      .catch(helpers.handler);
  });

  it('GET /rubrics/:id returns a single Rubric ', () => {
    return agent.get('/rubrics/'.concat(rubric.id))
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('DELETE /rubrics/:id will send back a 404 if the Rubric id does not exist', () => {
    return agent.delete('/rubrics/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /rubrics/:id will send back a 404 if the Rubric id is a string', () => {
    return agent.delete('/rubrics/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /rubrics/:id should delete a Rubric ', () => {
    return agent.delete('/rubrics/'.concat(rubric.id))
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  // INTEGRATION TEST FOR RUBRIC CONFIGURATION

  it('GET /payroll/rubric_config returns a list of rubrics', () => {
    return agent.get('/payroll/rubric_config')
      .then((res) => {
        helpers.api.listed(res, NUM_CONFIG_RUBRICS);
      })
      .catch(helpers.handler);
  });

  it('POST /payroll/rubric_config should create a new Rubric Configuration', () => {
    return agent.post('/payroll/rubric_config')
      .send(rubricConfig)
      .then((res) => {
        rubricConfig.id = res.body.id;
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('GET /payroll/rubric_config/:id will send back a 404 if the Rubric Configuration id does not exist', () => {
    return agent.get('/payroll/rubric_config/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /payroll/rubric_config/:id will send back a 404 if the Rubric Configuration id is a string', () => {
    return agent.get('/payroll/rubric_config/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /payroll/rubric_config should update an existing Rubric Configuration', () => {
    return agent.put('/payroll/rubric_config/'.concat(rubricConfig.id))
      .send(rubricConfigUpdate)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal('Configuration 2013 Updated');
        expect(res.body.items).to.have.length(2);
      })
      .catch(helpers.handler);
  });

  it('GET /payroll/rubric_config/:id returns a single Rubric Configuration', () => {
    return agent.get('/payroll/rubric_config/'.concat(rubricConfig.id))
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.items).to.have.length(2);
      })
      .catch(helpers.handler);
  });

  it('DELETE /payroll/rubric_config/:id will send back a 404 if the Rubric Configuration id does not exist', () => {
    return agent.delete('/payroll/rubric_config/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /payroll/rubric_config/:id will send back a 404 if the Rubric Configuration id is a string', () => {
    return agent.delete('/payroll/rubric_config/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /payroll/rubric_config/:id should delete a Rubric ', () => {
    return agent.delete('/payroll/rubric_config/'.concat(rubricConfig.id))
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });
});
