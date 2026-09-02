const server = require('../../bin/server/app');

describe('test/integration/zz-users-password-authorization Password authorization', () => {
  const victim = {
    username : 'passwordAuthorizationVictim',
    password : 'VictimOriginalPassword1!',
    newPassword : 'VictimAdminResetPassword2!',
    attackPassword : 'VictimAttackPassword3!',
    projects : [1],
    email : 'password-authorization-victim@test.org',
    display_name : 'Password Authorization Victim',
    preferred_language : 'en',
  };

  const regularUser = {
    id : 2,
    username : 'RegularUser',
    password : 'RegularUser',
    newPassword : 'RegularUserNewPassword1!',
  };

  const superuser = {
    id : 1,
    username : 'superuser',
    password : 'superuser',
    attackPassword : 'SuperuserAttackPassword1!',
  };

  let regularAgent;
  let originalRegularRoleUuids;

  before(async () => {
    const createResponse = await agent.post('/users').send(victim);
    expect(createResponse).to.have.status(201);
    victim.id = createResponse.body.id;

    const rolesResponse = await agent.get('/roles');
    expect(rolesResponse).to.have.status(200);
    const regularRole = rolesResponse.body.find(role => role.label === 'Regular');
    expect(regularRole).to.exist;

    const regularUserRolesResponse = await agent.get(`/roles/user/${regularUser.id}`);
    expect(regularUserRolesResponse).to.have.status(200);
    originalRegularRoleUuids = regularUserRolesResponse.body
      .filter(role => role.affected)
      .map(role => role.uuid);

    const roleResponse = await agent.post('/roles/assignTouser').send({
      user_id : regularUser.id,
      role_uuids : [regularRole.uuid],
    });
    expect(roleResponse).to.have.status(201);

    const victimRoleResponse = await agent.post('/roles/assignTouser').send({
      user_id : victim.id,
      role_uuids : [regularRole.uuid],
    });
    expect(victimRoleResponse).to.have.status(201);

    regularAgent = chai.request.agent(server);
    const loginResponse = await regularAgent.post('/auth/login').send({
      username : regularUser.username,
      password : regularUser.password,
      project : 1,
    });
    expect(loginResponse).to.have.status(200);
  });

  after(async () => {
    // Restore fixture passwords even if an assertion fails on a vulnerable baseline.
    await agent.put(`/users/${regularUser.id}/password`).send({ password : regularUser.password });
    await agent.put(`/users/${victim.id}/password`).send({ password : victim.password });
    await agent.put(`/users/${superuser.id}/password`).send({ password : superuser.password });
    await agent.post('/roles/assignTouser').send({
      user_id : regularUser.id,
      role_uuids : originalRegularRoleUuids,
    });
    regularAgent.close();
  });

  it('rejects an unauthenticated password change', async () => {
    const response = await chai.request(server)
      .put(`/users/${victim.id}/password`)
      .send({ password : victim.attackPassword });

    expect(response).to.have.status(401);
  });

  it('allows a regular user to change their own password', async () => {
    const response = await regularAgent
      .put(`/users/${regularUser.id}/password`)
      .send({ password : regularUser.newPassword });
    expect(response).to.have.status(200);

    await expectLogin(regularUser.username, regularUser.newPassword, 200);
    await agent.put(`/users/${regularUser.id}/password`).send({ password : regularUser.password });
    await expectLogin(regularUser.username, regularUser.password, 200);
  });

  it('denies a regular user changing another regular user password without updating it', async () => {
    const response = await regularAgent
      .put(`/users/${victim.id}/password`)
      .send({ password : victim.attackPassword });
    expect(response).to.have.status(403);

    await expectLogin(victim.username, victim.password, 200);
    await expectLogin(victim.username, victim.attackPassword, 401);
  });

  it('denies a regular user changing the superuser password without updating it', async () => {
    const response = await regularAgent
      .put(`/users/${superuser.id}/password`)
      .send({ password : superuser.attackPassword });
    expect(response).to.have.status(403);

    await expectLogin(superuser.username, superuser.password, 200);
    await expectLogin(superuser.username, superuser.attackPassword, 401);
  });

  it('prevents a regular user from self-granting the reset permission', async () => {
    const rolesResponse = await agent.get(`/roles/user/${regularUser.id}`);
    const regularRole = rolesResponse.body.find(role => role.affected);
    expect(regularRole).to.exist;

    const response = await regularAgent.post('/roles/actions').send({
      role_uuid : regularRole.uuid,
      action_ids : [1],
    });
    expect(response).to.have.status(403);

    const passwordResponse = await regularAgent
      .put(`/users/${victim.id}/password`)
      .send({ password : victim.attackPassword });
    expect(passwordResponse).to.have.status(403);
    await expectLogin(victim.username, victim.password, 200);
    await expectLogin(victim.username, victim.attackPassword, 401);
  });

  it('allows an administrator to reset another user password', async () => {
    const response = await agent
      .put(`/users/${victim.id}/password`)
      .send({ password : victim.newPassword });
    expect(response).to.have.status(200);

    await expectLogin(victim.username, victim.newPassword, 200);
    await agent.put(`/users/${victim.id}/password`).send({ password : victim.password });
    await expectLogin(victim.username, victim.password, 200);
  });

  async function expectLogin(username, password, status) {
    const response = await chai.request(server)
      .post('/auth/login')
      .send({ username, password, project : 1 });
    expect(response).to.have.status(status);
  }
});
