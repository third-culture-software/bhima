/* eslint no-unused-expressions:off */
/* global expect, agent */

const helpers = require('./helpers');

/*
 * The /roles API
 *
 * This test suite implements full CRUD on the /roles API.
 */
describe('test/integration/roles The roles API', () => {

  // role we will add during this test suite.
  const newRole = {
    label : 'Receptionniste',
  };

  const adminUuid = '5B7DD0D692734955A703126FBD504B61';
  const regularUserRoleUuid = '5F7DD0C692734955A703126FBD504B61';
  const regularUserRoleUnits = [
    { id : 0, key : 'TREE.ROOT', parent : null },
    { id : 1, key : 'TREE.ADMIN', parent : 0 },
    { id : 2, key : 'TREE.ENTERPRISE', parent : 1 },
    { id : 3, key : 'TREE.INVOICE_REGISTRY', parent : 5 },
    { id : 4, key : 'TREE.USERS', parent : 1 },
  ];

  const canEditRoleAction = 1;
  const roleAdmin = {
    label : 'Administrator',
  };

  const userRole = {
    user_id : 2,
    role_uuids : adminUuid,
  };

  const actions = {
    role_uuid : adminUuid,
    action_ids : [1],
  };

  it('GET /roles returns a list of roles two roles', () => {
    return agent.get('/roles')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.length(2);
      })
      .catch(helpers.handler);
  });

  it('POST /roles add a new role', () => {
    return agent.post('/roles')
      .send(newRole)
      .then(res => {
        expect(res).to.have.status(201);
        newRole.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('PUT /roles update admin role\'s label', () => {
    return agent.put(`/roles/${adminUuid}`)
      .send(roleAdmin)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('POST /roles/assignTouser assingning role to a user', () => {
    return agent.post('/roles/assignTouser')
      .send(userRole)
      .then(res => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /roles/actions/:roleUuid Should retrieve all assigned and unassigned actions to a role', () => {
    return agent.get('/roles/actions/'.concat(adminUuid))
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
      })
      .catch(helpers.handler);
  });

  it('GET /roles/actions/user/:action_id Should test if a action is assigned to the connected user', () => {
    return agent.get('/roles/actions/user/'.concat(canEditRoleAction))
      .then(res => {
        expect(res.body).to.be.equal(true);
      })
      .catch(helpers.handler);
  });

  it('POST /roles/actions assingning actions to a role', () => {
    return agent.post('/roles/actions')
      .send(actions)
      .then(res => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /roles/user/:user_id/ should test if a action is assigned to the connected user', () => {
    return agent.get('/roles/user/1')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
      })
      .catch(helpers.handler);
  });

  it(`GET /roles/${regularUserRoleUuid}/units should list of the units assigned to a user`, () => {
    return agent.get(`/roles/${regularUserRoleUuid}/units`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.deep.equal(regularUserRoleUnits);
      })
      .catch(helpers.handler);
  });
});
