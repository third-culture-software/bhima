/* global chai */

const helpers = require('./helpers');

describe('test/integration/login The login authorization API', () => {

  const port = process.env.PORT || 8080;
  const url = `http://localhost:${port}`;

  // set up valid user
  const validUser = {
    username : 'superuser',
    password : 'superuser',
    project : 1,
  };

  const invalidUser = {
    username : 'unauthorized',
    password : 'unauthorized',
  };

  const deactivatedUser = {
    username : 'admin',
    password : '1',
    project : 1,
  };

  it('rejects access to non-existant routes', () => {
    return chai.request(url)
      .get('/non-existant')
      .then(res => {
        helpers.api.errored(res, 401);
        expect(res.body.code).to.equal('ERRORS.UNAUTHORIZED');
      })
      .catch(helpers.handler);
  });

  it('rejects access to non-public routes', () => {
    return chai.request(url)
      .get('/journal')
      .then(res => {
        helpers.api.errored(res, 401);
        expect(res.body.code).to.equal('ERRORS.UNAUTHORIZED');
      })
      .catch(helpers.handler);
  });

  it('allows access to public routes', () => {
    return chai.request(url)
      .get('/projects')
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('rejects an unrecognized user', () => {
    return chai.request(url)
      .post('/auth/login')
      .send(invalidUser)
      .then(res => {
        helpers.api.errored(res, 401);
        expect(res.body.code).to.equal('ERRORS.UNAUTHORIZED');
      })
      .catch(helpers.handler);
  });

  it('rejects a deactivated user', () => {
    return chai.request(url)
      .post('/auth/login')
      .send(deactivatedUser)
      .then(res => {
        helpers.api.errored(res, 401);
        expect(res.body.code).to.equal('FORM.ERRORS.LOCKED_USER');
      })
      .catch(helpers.handler);
  });

  it('rejects a recognized user user without a project', () => {
    return chai.request(url)
      .post('/auth/login')
      .send({ username : validUser.username, password : validUser.password })
      .then(res => {
        helpers.api.errored(res, 401);
        expect(res.body.code).to.equal('ERRORS.NO_PROJECT');
      })
      .catch(helpers.handler);
  });

  it('rejects a recognized user without a password', () => {
    return chai.request(url)
      .post('/auth/login')
      .send({ username : validUser.username, project : validUser.project })
      .then(res => {
        helpers.api.errored(res, 401);
        expect(res.body.code).to.equal('ERRORS.UNAUTHORIZED');
      })
      .catch(helpers.handler);
  });

  it('sets a user\'s session properties', () => {
    return chai.request(url)
      .post('/auth/login')
      .send(validUser)
      .then(res => {

        expect(res).to.have.status(200);
        expect(res.body).to.have.keys('enterprise', 'user', 'project', 'stock_settings', 'paths', 'actions', 'token');
        expect(res.body.user).to.contain.all.keys(
          'id', 'enterprise_id', 'display_name', 'project_id', 'username', 'email',
        );
        expect(res.body.enterprise).to.contain.all.keys('id', 'currency_id', 'currencySymbol', 'settings');
        expect(res.body.project).to.contain.all.keys('id', 'name', 'abbr', 'enterprise_id');
        expect(res.body.paths[0]).to.contain.all.keys('path', 'authorized');

        expect(res.body.enterprise.settings).to.be.an('object');
        expect(res.body.enterprise.settings).to.contain.all.keys('enable_price_lock');
      })
      .catch(helpers.handler);
  });
});
