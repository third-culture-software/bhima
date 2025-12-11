/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

describe('test/integration/services The Services API', () => {
  const newService = {
    enterprise_id : 1,
    name : 'tested Service',
    project_id : 1,
  };

  const responseKeys = [
    'uuid', 'name', 'enterprise_id', 'hidden', 'project_id', 'project_name',
  ];
  it('POST /services adds a services', () => {
    return agent.post('/services')
      .send(newService)
      .then((res) => {
        helpers.api.created(res);
        newService.uuid = res.body.uuid;
        return agent.get(`/services/${newService.uuid}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('GET /services returns a list of services', () => {
    return agent.get('/services')
      .then((res) => {
        helpers.api.listed(res, 11);
      })
      .catch(helpers.handler);
  });

  it('GET /services/:uuid returns one services', () => {
    return agent.get(`/services/${newService.uuid}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body.uuid).to.be.equal(newService.uuid);
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('GET /services/:uuid/cost-center returns a cost center associated with the service', () => {
    const medicineInterne = 'e3988489-ef66-41df-88fa-8b8ed6aa03ac';
    return agent.get(`/services/${medicineInterne}/cost-center`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.id).to.be.equal(2);
      })
      .catch(helpers.handler);
  });

  it('PUT /services/:uuid updates the newly added services', () => {
    const updateInfo = { name : 'other' };
    return agent.put(`/services/${newService.uuid}`)
      .send(updateInfo)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.uuid).to.equal(newService.uuid);
        expect(res.body.name).to.equal(updateInfo.name);
      })
      .catch(helpers.handler);
  });

  it('DELETE /services/:uuid deletes a service', () => {
    return agent.delete(`/services/${newService.uuid}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/services/${newService.uuid}`);
      })
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /services/:uuid will send back a 404 if the services id does not exist', () => {
    return agent.delete('/services/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /services/:uuid will send back a 404 if the services id is a string', () => {
    return agent.delete('/services/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
