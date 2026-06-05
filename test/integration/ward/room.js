

const helpers = require('../helpers');
const shared = require('./shared');

/*
 * The /rooms API
 *
 * This test suite implements full CRUD on the /rooms API.
 */
describe('test/integration/ward/rooms The Ward Room API', () => {
  const EXISTING_ROOMS_IN_DB = 2;
  // rooms we will add during this test suite.
  const room1 = {
    uuid : '1CED245CEC0449C79D81501C7F6AAB24',
    label : 'Room A',
    ward_uuid : shared.ward1.uuid,
    room_type_id : 1,
  };

  const room2 = {
    uuid : '1CED245CEC0449C79D81501C7F6AAB55',
    label : 'Room B',
    ward_uuid : shared.ward2.uuid,
  };

  const roomUpdate = {
    uuid : room1.uuid,
    label : 'Room A moved to ward 2',
    ward_uuid : shared.ward2.uuid,
  };

  it('POST /rooms add a new room', () => {
    return agent.post('/rooms')
      .send(room1)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('POST /rooms add room not linked to a room type', () => {
    return agent.post('/rooms')
      .send(room2)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /rooms returns a list of rooms', () => {
    return agent.get('/rooms')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.length(2 + EXISTING_ROOMS_IN_DB);
      })
      .catch(helpers.handler);
  });

  it('PUT /rooms update a room', () => {
    return agent.put(`/rooms/${room1.uuid}`)
      .send(roomUpdate)
      .then((res) => {
        expect(res).to.have.status(200);
        return agent.get(`/rooms/${room1.uuid}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal(roomUpdate.label);
        expect(res.body.ward_uuid).to.equal(roomUpdate.ward_uuid);
      })
      .catch(helpers.handler);

  });

  it('DELETE /rooms should delete an existing room', () => {
    return agent.delete(`/rooms/${room2.uuid}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/rooms`);
      })
      .then(res => {
        expect(res.body).to.be.length(1 + EXISTING_ROOMS_IN_DB);
      })
      .catch(helpers.handler);
  });

});
