const helpers = require('./helpers');

/*
 * The /payroll/weekend_configuration  API
 *
 * This test suite implements full CRUD on the /payroll/weekend_configuration  API.
 */
describe('test/integration/weekEndConfig The /payroll/weekend_configuration  API', () => {
  const weekEndConfig = {
    label : 'Configuration Week end 2013',
    daysChecked : [0, 5, 6],
  };

  const weekEndConfigUpdate = {
    label : 'Configuration Week end 2013 Updated',
    daysChecked : [],
  };

  const NUM_CONFIG_WEEKEND = 3;

  // INTEGRATION TEST FOR WEEK_END_ CONFIGURATION
  it('POST /weekend_config should create a new week end Configuration', () => {
    return agent.post('/weekend_config')
      .send(weekEndConfig)
      .then((res) => {
        weekEndConfig.id = res.body.id;
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('GET /weekend_config returns a list of Weekend Configured ', () => {
    return agent.get('/weekend_config')
      .then((res) => {
        helpers.api.listed(res, NUM_CONFIG_WEEKEND);
      })
      .catch(helpers.handler);
  });

  it('GET /weekend_config/:id will send back a 404 if the week end Configuration id does not exist', () => {
    return agent.get('/weekend_config/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /weekend_config/:id will send back a 404 if the week end Configuration id is a string', () => {
    return agent.get('/weekend_config/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /weekend_config should update an existing week end Configuration', () => {
    return agent.put('/weekend_config/'.concat(weekEndConfig.id))
      .send(weekEndConfigUpdate)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal(weekEndConfigUpdate.label);
      })
      .catch(helpers.handler);
  });

  it('GET /weekend_config/:id returns a single week end Configuration', () => {
    return agent.get('/weekend_config/'.concat(weekEndConfig.id))
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('DELETE /weekend_config/:id will send back a 404 if the week end Configuration does not exist', () => {
    return agent.delete('/weekend_config/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /weekend_config/:id will send back a 404 if the week end Configuration is a string', () => {
    return agent.delete('/weekend_config/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /weekend_config/:id should delete a week end ', () => {
    return agent.delete('/weekend_config/'.concat(weekEndConfig.id))
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

});
