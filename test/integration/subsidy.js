
 

const helpers = require('./helpers');

// FIXME(@jniles) - make a subventions/subsidy account

describe('test/integration/subsidy Subsidies API', () => {
  const newSubsidy = {
    account_id : 211, // 60310012 - Achat Médicaments en crème
    label :       'tested subsidy',
    description : 'This is for the test',
    value :       10,
  };

  const wrongSubsidy = {
    account_id : 213, // 60310014 - Achat Injectables
    label :       'tested wrong subsidy',
    description : 'This is for the wrong value test',
    value :       -10,
  };

  const responseKeys = [
    'id', 'account_id', 'label', 'description', 'value', 'created_at', 'updated_at',
  ];

  it('GET /subsidies returns a list of two subsidies', () => {
    return agent.get('/subsidies')
      .then(res => {
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });

  it('POST /subsidies adds a subsidy', () => {
    return agent.post('/subsidies')
      .send(newSubsidy)
      .then(res => {
        helpers.api.created(res);
        newSubsidy.id = res.body.id;
        return agent.get(`/subsidies/${newSubsidy.id}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('POST /subsidies refuses to add an incorrectly formatted subsidy', () => {
    return agent.post('/subsidies')
      .send(wrongSubsidy)
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('GET /subsidies returns an array of three subsidies', () => {
    return agent.get('/subsidies')
      .then(res => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

  it('GET /subsidies/:id returns one subsidy', () => {
    return agent.get(`/subsidies/${newSubsidy.id}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body.id).to.be.equal(newSubsidy.id);
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('PUT /subsidies/:id updates the newly added subsidy', () => {
    const updateInfo = { value : 50 };
    return agent.put(`/subsidies/${newSubsidy.id}`)
      .send(updateInfo)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.id).to.equal(newSubsidy.id);
        expect(res.body.value).to.equal(updateInfo.value);
      })
      .catch(helpers.handler);
  });

  it('DELETE /subsidies/:id deletes a subsidy', () => {
    return agent.delete(`/subsidies/${newSubsidy.id}`)
      .then(res => {
        // make sure the record is deleted
        helpers.api.deleted(res);

        // re-query the database
        return agent.get(`/subsidies/${newSubsidy.id}`);
      })
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
