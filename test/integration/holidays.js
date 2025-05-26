/* global expect, agent */

const helpers = require('./helpers');

/*
 * The /holidays  API
 *
 * This test suite implements full CRUD on the /holidays  API.
 */
describe('test/integration/holidays The /holidays  API', () => {

  // Holiday we will add during this test suite.

  const holiday = {
    label           : 'Conge Maternite',
    employee_uuid   : '75e09694-65f2-45a1-a8a2-8b025003d793',
    dateFrom        : '2017-11-01',
    dateTo          : '2017-11-29',
  };

  const NUM_HOLIDAYS = 1;

  it('GET /HOLIDAYS returns a list of function ', () => {
    return agent.get('/holidays')
      .then((res) => {
        helpers.api.listed(res, NUM_HOLIDAYS);
      })
      .catch(helpers.handler);
  });

  it('POST /HOLIDAYS should create a new Holiday', () => {
    return agent.post('/holidays')
      .send(holiday)
      .then((res) => {
        holiday.id = res.body.id;
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('GET /HOLIDAYS/:ID will send back a 404 if the holidays id does not exist', () => {
    return agent.get('/holidays/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /HOLIDAYS/:ID will send back a 404 if the holidays id is a string', () => {
    return agent.get('/holidays/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /HOLIDAYS  should update an existing Holiday ', () => {
    return agent.put('/holidays/'.concat(holiday.id))
      .send({ label : 'Holiday Updated', employee_uuid : '75e09694-65f2-45a1-a8a2-8b025003d793' })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal('Holiday Updated');
      })
      .catch(helpers.handler);
  });

  it('GET /HOLIDAYS/:ID returns a single Holiday ', () => {
    return agent.get('/holidays/'.concat(holiday.id))
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('DELETE /HOLIDAYS/:ID will send back a 404 if the Holidays id does not exist', () => {
    return agent.delete('/holidays/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /HOLIDAYS/:ID will send back a 404 if the Holidays id is a string', () => {
    return agent.delete('/holidays/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /HOLIDAYS/:ID should delete a Holiday ', () => {
    return agent.delete('/holidays/'.concat(holiday.id))
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });
});
