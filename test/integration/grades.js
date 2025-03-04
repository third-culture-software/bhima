/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /grades API
 *
 * This test suite implements full CRUD on the /grades   API.
 */
describe('test/integration/grades The grades API', () => {

  // grade we will add during this test suite.
  const grade = {
    code : 'G2',
    text : 'Grade 2',
    basic_salary : 150,
  };

  const responseKeys = ['uuid', 'code', 'text', 'basic_salary'];
  const numGrades = 19;

  it('GET /grades returns a list of grade ', () => {
    return agent.get('/grades')
      .then((res) => {
        helpers.api.listed(res, numGrades);
      })
      .catch(helpers.handler);
  });

  it('POST /grades should create a new grade', () => {
    return agent.post('/grades')
      .send(grade)
      .then((res) => {
        helpers.api.created(res);
        grade.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('GET /grades/:uuid will send back a 404 if the graded id does not exist', () => {
    return agent.get('/grades/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /grades/:uuid will send back a 404 if the graded id is a string', () => {
    return agent.get('/grades/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /grades should update an existing Grade ', () => {
    return agent.put(`/grades/${grade.uuid}`)
      .send({ basic_salary : 2000 })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(responseKeys);
        expect(res.body.basic_salary).to.equal(2000);
      })
      .catch(helpers.handler);
  });

  it('GET /grades/:uuid returns a single grade ', () => {
    return agent.get(`/grades/${grade.uuid}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
      })
      .catch(helpers.handler);
  });

  it('DELETE /grades/:uuid will send back a 404 if the grade does not exist', () => {
    return agent.delete('/grades/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /grades/:uuid will send back a 404 if the grade id is a string', () => {
    return agent.delete('/grades/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /grades/:uuid should delete a grade', () => {
    return agent.delete(`/grades/${grade.uuid}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });
});
