
const helpers = require('../helpers');

describe('test/integration/entities Entities API', () => {
  const types = {
    PERSON : 1,
    SERVICE : 2,
    OFFICE : 3,
    ENTERPRISE : 4,
  };

  const person = {
    uuid : helpers.uuid(),
    display_name : 'Mr Jean Jacques Rousseau',
    gender : 'M',
    phone : '+330000000000',
    email : 'jjr@history.france',
    address : 'France',
    entity_type_id : types.PERSON,
  };

  const service = {
    uuid : helpers.uuid(),
    display_name : 'IMT OFFICE',
    gender : 'O',
    entity_type_id : types.SERVICE,
  };

  const responseKeys = [
    'uuid', 'display_name', 'gender', 'email', 'phone',
    'address', 'reference', 'entity_type_id', 'label', 'translation_key',
    'title',
  ];

  const NUM_ENTITIES = 4;

  it('POST /entities Create a new person entity', () => {
    return agent.post('/entities')
      .send(person)
      .then(res => {
        helpers.api.created(res);
        return agent.get(`/entities/${res.body.uuid}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('POST /entities Create a new service entity', () => {
    return agent.post('/entities')
      .send(service)
      .then(res => {
        helpers.api.created(res);
        return agent.get(`/entities/${res.body.uuid}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('GET /entities returns the list of all entities', () => {
    return agent.get('/entities')
      .then(res => {
        helpers.api.listed(res, NUM_ENTITIES);
      })
      .catch(helpers.handler);
  });

  it('PUT /entites/:uuid updates the newly added entity', () => {
    const updateInfo = {
      display_name : 'IMT/DHIS2 OFFICE',
      gender : 'X',
      entity_type_id : types.PERSON,
    };
    return agent.put(`/entities/${service.uuid}`)
      .send(updateInfo)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        expect(res.body.uuid).to.equal(service.uuid);
        expect(res.body.display_name).to.equal(updateInfo.display_name);
        expect(res.body.gender).to.equal(updateInfo.gender);
        expect(res.body.entity_type_id).to.equal(updateInfo.entity_type_id);
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('DELETE /entities/:uuid delete an entity by its uuid', () => {
    return agent.delete(`/entities/${service.uuid}`)
      .then(res => {
        expect(res).to.have.status(204);
        return agent.get('/entities');
      })
      .then(res => {
        helpers.api.listed(res, NUM_ENTITIES - 1);
      })
      .catch(helpers.handler);
  });

});
