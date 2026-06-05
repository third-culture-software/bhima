
const helpers = require('./helpers');

describe('test/integration/choiceListManagement Choice List Management', () => {
  const numListElement = 28;

  const newElementList = {
    name : 'oshwe',
    label : 'OSHWE',
    fixed : 0,
    parent : 0,
    group_label : 0,
    is_group : 0,
    is_title : 0,
  };

  const updateElementList = {
    parent : 20,
    group_label : 15,
  };

  it('POST /choises_list_management add Choice List Element', () => {
    return agent.post('/choices_list_management')
      .send(newElementList)
      .then((res) => {
        helpers.api.created(res);
        newElementList.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('GET /choices_list_management/:id returns one Choice List Management as detail', () => {
    return agent.get(`/choices_list_management/${newElementList.id}`)
      .then((res) => {
        expect(res).to.have.status(200);

        expect(res).to.be.a('object');
        expect(res.body).to.have.all.keys('id', 'name', 'label', 'fixed', 'parent',
          'group_label', 'is_group', 'is_title');
      })
      .catch(helpers.handler);
  });

  it('PUT /choices_list_management/:id updates the newly added Choice List Management', () => {
    return agent.put(`/choices_list_management/${newElementList.id}`)
      .send(updateElementList)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.a('object');
        expect(res.body.id).to.equal(newElementList.id);
      })
      .catch(helpers.handler);
  });

  it('GET /choices_list_management returns all Choice List Management', () => {
    return agent.get(`/choices_list_management/`)
      .then((res) => {
        helpers.api.listed(res, numListElement);
        expect(res.body[0]).to.have.all.keys('id', 'name', 'label', 'fixed', 'parent',
          'group_label', 'is_group', 'is_title');
      })
      .catch(helpers.handler);
  });

  it('DELETE /choices_list_management/:id deletes a Choice List Management', () => {
    return agent.delete(`/choices_list_management/${newElementList.id}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/choices_list_management/${newElementList.id}`);
      })
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
