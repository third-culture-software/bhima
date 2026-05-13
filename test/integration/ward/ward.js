
const helpers = require('../helpers');

/*
 * The /wards API
 *
 * This test suite implements full CRUD on the /wards API.
 */
describe('test/integration/ward/wards The ward API', () => {
  const EXISTING_WARDS_IN_DB = 2;
  // wards we will add during this test suite.
  const uuid = '5b7dd0d6-9273-4955-a703-126fbd504b61';
  const uuid2 = '7b7dd0d6-9273-4955-a703-126fbd504b61';

  const ward = {
    uuid,
    name : 'ward 1',
    description : 'Frist ward',
  };

  const ward2 = {
    uuid : uuid2,
    name : 'ward 2',
    description : 'Second ward',
  };

  const wardUpdate = {
    uuid,
    name : 'ward A',
  };

  it('POST /wards add a new ward', () => {
    return agent.post('/wards')
      .send(ward)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('POST /wards add ward not linked to a service', () => {
    return agent.post('/wards')
      .send(ward2)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /wards returns a list of wards', () => {
    return agent.get('/wards')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.length(2 + EXISTING_WARDS_IN_DB);
      })
      .catch(helpers.handler);
  });

  it('PUT /wards update a ward', () => {
    return agent.put(`/wards/${uuid}`)
      .send(wardUpdate)
      .then((res) => {
        expect(res).to.have.status(200);
        return agent.get(`/wards/${uuid}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.name).to.equal(wardUpdate.name);
      })
      .catch(helpers.handler);

  });

  it('DELETE /wards should delete an existing ward', () => {
    return agent.delete(`/wards/${uuid2}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/wards`);
      })
      .then(res => {
        expect(res.body).to.be.length(1 + EXISTING_WARDS_IN_DB);
      })
      .catch(helpers.handler);
  });

});
