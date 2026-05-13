
const helpers = require('../helpers');

describe('test/integration/entities/types Entity Types API', () => {
  const type = { label : 'Super Human' };

  const responseKeys = [
    'id', 'label', 'translation_key',
  ];

  const DEFAULT_TYPES = 4;
  const NUM_TYPES = DEFAULT_TYPES + 1;

  let identifier;

  it('POST /entities/types Create a new entity type', () => {
    return agent.post('/entities/types')
      .send(type)
      .then(res => {
        helpers.api.created(res);
        identifier = res.body.id;
        return agent.get(`/entities/types/${res.body.id}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('GET /entities/types returns the list of all entities/types', () => {
    return agent.get('/entities/types')
      .then(res => {
        helpers.api.listed(res, NUM_TYPES);
      })
      .catch(helpers.handler);
  });

  it('PUT /entites/:uuid updates the newly added entity', () => {
    const updateInfo = {
      label : 'Human',
      translation_key : 'HUMAN',
    };
    return agent.put(`/entities/types/${identifier}`)
      .send(updateInfo)
      .then(res => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });

  it('DELETE /entities/types/:uuid delete an entity type by its id', () => {
    return agent.delete(`/entities/types/${identifier}`)
      .then(res => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });

});
