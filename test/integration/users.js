/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /users API
 *
 * This test suite implements full CRUD on the /users API.
 */
describe('test/integration/users Users and Permissions', () => {
  const newUser = {
    username      : 'newUser',
    password      : 'newUser',
    projects      : [1],
    email         : 'newUser@test.org',
    first         : 'new',
    last          : 'user',
    display_name  : 'New Utilisateur',
    preferred_language : 'fr',
  };

  const badUser = {
    username : 'username',
    password : 'password',
  };

  const depots = [
    'f9caeb16-1684-43c5-a6c4-47dbac1df296',
    'd4bb1452-e4fa-4742-a281-814140246877',
  ];

  const depotsSupervision = [
    'bd4b1452-4742-e4fa-a128-246814140877',
  ];

  // this is a depot uuid
  const depotManagementSupervision = 'F9CAEB16168443C5A6C447DBAC1DF296';
  const usersManagement = [2];
  const usersSupervision = [3, 4];

  const cashboxes = [1, 2];

  it('GET /users returns a list of users', () => {
    return agent.get('/users')
      .then(res => {
        helpers.api.listed(res, 4);
      })
      .catch(helpers.handler);
  });

  it('POST /users will add a valid user', () => {
    return agent.post('/users')
      .send(newUser)
      .then(res => {
        helpers.api.created(res);

        // cache the user id
        newUser.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('POST /users will reject an invalid user', () => {
    return agent.post('/users')
      .send(badUser)
      .then(res => {
        helpers.api.errored(res, 400, 'ERRORS.ER_BAD_NULL_ERROR');
      })
      .catch(helpers.handler);
  });

  it('POST /users with empty object will send 400 error code', () => {
    return agent.post('/users')
      .send({})
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('GET /users/:id/projects should not find one project assigned to the new user', () => {
    return agent.get(`/users/${newUser.id}/projects`)
      .then(res => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it('GET /users/:id will find the newly added user', () => {
    return agent.get(`/users/${newUser.id}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.email).to.equal(newUser.email);
        expect(res.body.display_name).to.equal(newUser.display_name);
        expect(res.body.preferred_lang).to.equal(newUser.preferred_lang);
      })
      .catch(helpers.handler);
  });

  it('PUT /users/:id will update the newly added user', () => {
    return agent.put(`/users/${newUser.id}`)
      .send({ email : 'email@test.org' })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.username).to.equal(newUser.username);
        expect(res.body.email).to.not.equal(newUser.email);

        // re-query the database
        return agent.get(`/users/${newUser.id}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.email).to.equal('email@test.org');
      })
      .catch(helpers.handler);
  });

  it('PUT /users/:id will update a user\'s projects', () => {
    return agent.put(`/users/${newUser.id}`)
      .send({ projects : [1, 2] })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.username).to.equal(newUser.username);
        expect(res.body.projects).to.deep.equal([1, 2]);

        // re-query the database
        return agent.get(`/users/${newUser.id}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.email).to.equal('email@test.org');
      })
      .catch(helpers.handler);
  });

  it('PUT /users/:id will NOT update the new user\'s password', () => {
    return agent.put(`/users/${newUser.id}`)
      .send({ password : 'I am super secret.' })
      .then(res => {
        helpers.api.errored(res, 400);
        expect(res.body.code).to.equal('ERRORS.PROTECTED_FIELD');
      })
      .catch(helpers.handler);
  });

  it('PUT /users/:id/password will update the new user\'s password', () => {
    return agent.put(`/users/${newUser.id}/password`)
      .send({ password : 'I am super secret.' })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
      })
      .catch(helpers.handler);
  });

  it('PUT /users/:id/password will update a user\'s password', () => {
    return agent.put(`/users/${newUser.id}/password`)
      .send({ password : 'WOW' })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
      })
      .catch(helpers.handler);
  });

  it('DELETE /users/:id will not delete a user who has permissions set', () => {
    return agent.delete(`/users/${newUser.id}`)
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  // Add depot permissions for user
  it('POST /users/:id/depots will assign some depots to a user', () => {
    return agent.post(`/users/${newUser.id}/depots`)
      .send({ depots })
      .then(res => {
        expect(res).to.have.status(201);
        return agent.get(`/users/${newUser.id}/depots`);
      })
      .then(res => {
        helpers.api.listed(res, 2);
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
      })
      .catch(helpers.handler);
  });

  // Add depot supervision for user
  it('POST /users/:id/depotsSupervision will create user depots for supervision', () => {
    return agent.post(`/users/${newUser.id}/depotsSupervision`)
      .send({ depots : depotsSupervision })
      .then(res => {
        expect(res).to.have.status(201);
        return agent.get(`/users/${newUser.id}/depotsSupervision`);
      })
      .then(res => {
        helpers.api.listed(res, 1);
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
      })
      .catch(helpers.handler);
  });

  // Assign users management permissions for depot
  it('POST /users/:uuid/depotUsersManagment : assign users management permissions for depot', () => {
    return agent.post(`/users/${depotManagementSupervision}/depotUsersManagment`)
      .send({ users : usersManagement })
      .then(res => {
        expect(res).to.have.status(201);
        return agent.get(`/depots/${depotManagementSupervision}/management`);
      })
      .then(res => {
        helpers.api.listed(res, 1);
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  // Assign users supervision permissions for depot
  it('POST /users/:uuid/depotUsersSupervision: assign users supervision permissions for depot', () => {
    return agent.post(`/users/${depotManagementSupervision}/depotUsersSupervision`)
      .send({ users : usersSupervision })
      .then(res => {
        expect(res).to.have.status(201);
        return agent.get(`/depots/${depotManagementSupervision}/supervision`);
      })
      .then(res => {
        helpers.api.listed(res, 2);
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  // Reset depot permissions for user
  it('POST /users/:id/depots will reset user depots', () => {
    return agent.post(`/users/${newUser.id}/depots`)
      .send({ depots : [] })
      .then(res => {
        expect(res).to.have.status(201);
        return agent.get(`/users/${newUser.id}/depots`);
      })
      .then(res => {
        helpers.api.listed(res, 0);
        expect(res).to.have.status(200);
        expect(res.body).to.be.empty;
      })
      .catch(helpers.handler);
  });

  // Add cashbox permissions for user
  it('POST /users/:id/cashboxes will create user cashboxes', () => {
    return agent.post(`/users/${newUser.id}/cashboxes`)
      .send({ cashboxes })
      .then(res => {
        expect(res).to.have.status(201);
        return agent.get(`/users/${newUser.id}/cashboxes`);
      })
      .then(res => {
        helpers.api.listed(res, 2);
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
      })
      .catch(helpers.handler);
  });

  // Reset cashbox permissions for user
  it('POST /users/:id/cashboxes with empty array will reset user cashboxes', () => {
    return agent.post(`/users/${newUser.id}/cashboxes`)
      .send({ cashboxes : [] })
      .then(res => {
        expect(res).to.have.status(201);
        return agent.get(`/users/${newUser.id}/cashboxes`);
      })
      .then(res => {
        helpers.api.listed(res, 0);
        expect(res).to.have.status(200);
        expect(res.body).to.be.empty;
      })
      .catch(helpers.handler);
  });

  it('POST /users/:id/cashboxes will reject invalid data', () => {
    return agent.post(`/users/${newUser.id}/cashboxes`)
      .send({ })
      .then((result) => {
        helpers.api.errored(result, 400, 'ERRORS.BAD_DATA_FORMAT');
      })
      .catch(helpers.handler);
  });
});
