

const helpers = require('../helpers');
const shared = require('./shared');

/*
 * The /beds API
 *
 * This test suite implements full CRUD on the /beds API.
 */
describe('test/integration/war/beds The Ward Bed API', () => {
  // beds we will add during this test suite.
  const { bed1, bed2 } = shared;
  let id1;
  let id2;

  const EXPECTED_BEDS = 5;

  const bedUpdate = {
    id : bed1.id,
    label : 'Bed 1 change room',
    room_uuid : shared.room2.uuid,
  };

  it('POST /beds add a new bed', () => {
    return agent.post('/beds')
      .send(bed1)
      .then((res) => {
        id1 = res.body.id;
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('POST /beds add another bed', () => {
    return agent.post('/beds')
      .send(bed2)
      .then((res) => {
        id2 = res.body.id;
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /beds returns a list of beds', () => {
    return agent.get('/beds')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.length(EXPECTED_BEDS);
      })
      .catch(helpers.handler);
  });

  it('PUT /beds update a bed', () => {
    return agent.put(`/beds/${id1}`)
      .send(bedUpdate)
      .then((res) => {
        expect(res).to.have.status(200);
        return agent.get(`/beds/${id1}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal(bedUpdate.label);
      })
      .catch(helpers.handler);

  });

  it('DELETE /beds should delete an existing bed', () => {
    return agent.delete(`/beds/${id2}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/beds`);
      })
      .then(res => {
        expect(res.body).to.be.length(EXPECTED_BEDS - 1);
      })
      .catch(helpers.handler);
  });

});
