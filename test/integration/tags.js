/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /tags API
 *
 * This test suite implements full CRUD on the /projects API.
 */
describe('test/integration/tags The tags API', () => {
  // project we will add during this test suite.
  const uuid = '5b7dd0d6-9273-4955-a703-126fbd504b61';
  const uuid2 = '7b7dd0d692734955a703126fbd504b61';
  const tags = {
    uuid,
    name : 'Tag1',
  };
  const tags2 = {
    uuid : uuid2,
    name : 'Broken',
  };

  const tagsUpdate = {
    uuid,
    name : 'Repaired',
  };

  const TAGS_IN_TEST_DB = 2;

  it('POST /tags add a new tags', () => {
    return agent.post('/tags')
      .send(tags)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /tags returns a list of tags', () => {
    return agent.get('/tags')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body).to.be.length(1 + TAGS_IN_TEST_DB);
      })
      .catch(helpers.handler);
  });

  it('POST /tags add another tags', () => {
    return agent.post('/tags')
      .send(tags2)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /tags returns a list of tags', () => {
    return agent.get('/tags')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body).to.be.length(2 + TAGS_IN_TEST_DB);
      })
      .catch(helpers.handler);
  });

  it('POST /tags add a new tags with an existing name', () => {
    return agent.post('/tags')
      .send(tags)
      .then((res) => {
        expect(res).to.have.status(400);
      })
      .catch(helpers.handler);
  });

  it('PUT /tags update a tags', () => {
    return agent.put(`/tags/${uuid}`)
      .send(tagsUpdate)
      .then((res) => {
        expect(res).to.have.status(200);
        return agent.get(`/tags/${uuid}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.name).to.equal(tagsUpdate.name);
      })
      .catch(helpers.handler);

  });

  it('DELETE /tags should delete an existing tags', () => {
    return agent.delete(`/tags/${uuid2}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/tags`);
      })
      .then(res => {
        expect(res.body).to.be.length(1 + TAGS_IN_TEST_DB);
      })
      .catch(helpers.handler);
  });
});
