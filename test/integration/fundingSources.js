/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /funding_sources API
 *
 * This test suite implements full CRUD on the /funding_sources API.
 */
describe('test/integration/funding_sources The funding_sources API', () => {
  // project we will add during this test suite.
  const uuid = '5b7dd0d692734955a703126fbd504b61';
  const uuid2 = '7b7dd0d692734955a703126fbd504b61';

  const fundingSource1 = {
    uuid,
    label : 'Funding Source 1',
    code : 'Code Funding Source 1',
  };

  const fundingSource2 = {
    uuid : uuid2,
    label : 'Funding Source 2',
    code : 'Code Funding Source 2',
  };

  const fundingSourceUpdate = {
    uuid,
    label : 'Repaired',
    code : 'Code Repaired',
  };

  const FS_IN_TEST_DB = 0;

  it('POST /funding_sources add a new funding source', () => {
    return agent.post('/funding_sources')
      .send(fundingSource1)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /funding_sources returns a list of funding sources', () => {
    return agent.get('/funding_sources')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body).to.be.length(1 + FS_IN_TEST_DB);
      })
      .catch(helpers.handler);
  });

  it('POST /funding_sources add another funding source', () => {
    return agent.post('/funding_sources')
      .send(fundingSource2)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /funding_sources returns a list of funding sources', () => {
    return agent.get('/funding_sources')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body).to.be.length(2 + FS_IN_TEST_DB);
      })
      .catch(helpers.handler);
  });

  it('POST /funding_sources add a new funding source with an existing code', () => {
    return agent.post('/funding_sources')
      .send(fundingSource1)
      .then((res) => {
        expect(res).to.have.status(400);
      })
      .catch(helpers.handler);
  });

  it('PUT /funding_sources update a funding source', () => {
    return agent.put(`/funding_sources/${uuid}`)
      .send(fundingSourceUpdate)
      .then((res) => {
        expect(res).to.have.status(200);
        return agent.get(`/funding_sources/${uuid}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.name).to.equal(fundingSourceUpdate.name);
      })
      .catch(helpers.handler);

  });

  it('DELETE /funding_sources should delete an existing funding source', () => {
    return agent.delete(`/funding_sources/${uuid2}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/funding_sources`);
      })
      .then(res => {
        expect(res.body).to.be.length(1 + FS_IN_TEST_DB);
      })
      .catch(helpers.handler);
  });
});
