
 

const helpers = require('./helpers');

/*
 * The /titles  API
 *
 * This test suite implements full CRUD on the /titles  API.
 */
describe('test/integration/titles The job titles  API', () => {

  // Job titles we will add during this test suite.
  const jobTitle = {
    title_txt : 'Data scientist',
    is_medical : 1,
  };

  const TITLE_KEY = ['id', 'title_txt', 'is_medical'];
  const NUM_TITLES = 3;

  it('GET /TITLES returns a list of job title ', () => {
    return agent.get('/titles')
      .then((res) => {
        helpers.api.listed(res, NUM_TITLES);
      })
      .catch(helpers.handler);
  });

  it('POST /titles should create a new Job', () => {
    return agent.post('/titles')
      .send(jobTitle)
      .then((res) => {
        jobTitle.id = res.body.id;
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('GET /titles/:id will send back a 404 for an unknown id', () => {
    return agent.get('/titles/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /titles/:id will send back a 404 if the titles id is a string', () => {
    return agent.get('/titles/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /titles should update an existing Title ', () => {
    return agent.put(`/titles/${jobTitle.id}`)
      .send({ title_txt : 'Technicien imagerie' })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(TITLE_KEY);
        expect(res.body.title_txt).to.equal('Technicien imagerie');
      })
      .catch(helpers.handler);
  });

  it('GET /titles/:id returns a single title ', () => {
    return agent.get(`/titles/${jobTitle.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
      })
      .catch(helpers.handler);
  });

  it('DELETE /titles/:id will send back a 404 if the Title does not exist', () => {
    return agent.delete('/titles/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /titles/:id will send back a 404 if the Title id is a string', () => {
    return agent.delete('/titles/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /titles/:ID should delete a Title ', () => {
    return agent.delete(`/titles/${jobTitle.id}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });
});
