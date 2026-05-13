

const helpers = require('./helpers');

/*
 * The /offdays  API
 *
 * This test suite implements full CRUD on the /offdays  API.
 */
describe('test/integration/offdays The /offdays  API', () => {

  // Offday we will add during this test suite.

  const offday = {
    label           : 'Hero Lumumba',
    date            : '2017-01-17',
    percent_pay     : 100,
  };

  const NUM_OFFDAYS = 2;

  it('GET /OFFDAYS returns a list of Offday ', () => {
    return agent.get('/offdays')
      .then((res) => {
        helpers.api.listed(res, NUM_OFFDAYS);
      })
      .catch(helpers.handler);
  });

  it('POST /OFFDAYS should create a new Offday', () => {
    return agent.post('/offdays')
      .send(offday)
      .then((res) => {
        offday.id = res.body.id;
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('GET /OFFDAYS/:ID will send back a 404 if the offdays id does not exist', () => {
    return agent.get('/offdays/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /OFFDAYS/:ID will send back a 404 if the offdays id is a string', () => {
    return agent.get('/offdays/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /OFFDAYS  should update an existing Offday ', () => {
    return agent.put('/offdays/'.concat(offday.id))
      .send({ label : 'Offday Updated' })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal('Offday Updated');
      })
      .catch(helpers.handler);
  });

  it('GET /OFFDAYS/:ID returns a single Offday ', () => {
    return agent.get('/offdays/'.concat(offday.id))
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('DELETE /OFFDAYS/:ID will send back a 404 if the Offday id does not exist', () => {
    return agent.delete('/offdays/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /OFFDAYS/:ID will send back a 404 if the Offday id is a string', () => {
    return agent.delete('/offdays/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /OFFDAYS/:ID should delete a Offday ', () => {
    return agent.delete('/offdays/'.concat(offday.id))
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });
});
