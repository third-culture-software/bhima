/* global chai */

const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const helpers = require('./helpers');
const uploads = require('../../bin/server/lib/uploader');

describe('test/integration/login The login authorization API', () => {

  const port = process.env.PORT || 8080;
  const url = `http://localhost:${port}`;
  const sentinelName = `sentinel-${randomUUID()}.txt`;
  const sentinelContent = `BHIMA upload sentinel ${randomUUID()}`;
  const sentinelPath = path.resolve(uploads.directory, sentinelName);
  const legacySentinelPath = path.resolve('client/upload/uploads', sentinelName);

  before(async () => {
    await Promise.all([
      fs.mkdir(path.dirname(sentinelPath), { recursive : true }),
      fs.mkdir(path.dirname(legacySentinelPath), { recursive : true }),
    ]);
    await Promise.all([
      fs.writeFile(sentinelPath, sentinelContent),
      fs.writeFile(legacySentinelPath, sentinelContent),
    ]);
  });

  after(() => Promise.all([
    fs.rm(sentinelPath, { force : true }),
    fs.rm(legacySentinelPath, { force : true }),
  ]));

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

  it('rejects unauthenticated access to uploaded documents', () => {
    return chai.request(url)
      .get(`/uploads/${sentinelName}`)
      .then(res => {
        helpers.api.errored(res, 401);
        expect(res.body.code).to.equal('ERRORS.UNAUTHORIZED');
      })
      .catch(helpers.handler);
  });

  it('allows authenticated access to uploaded documents', () => {
    return agent.get(`/uploads/${sentinelName}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.text).to.equal(sentinelContent);
      })
      .catch(helpers.handler);
  });

  it('does not expose uploaded documents through the public client root', async () => {
    const aliases = [
      `/upload/uploads/${sentinelName}`,
      `/upload//uploads/${sentinelName}`,
      `/upload/./uploads/${sentinelName}`,
      `/%75pload/uploads/${sentinelName}`,
      `/upload/uploads%2F${sentinelName}`,
    ];

    for (const alias of aliases) {
      const anonymousResponse = await chai.request(url).get(alias);
      const authenticatedResponse = await agent.get(alias);

      expect(anonymousResponse).to.have.status(404);
      expect(anonymousResponse.text).to.not.include(sentinelContent);
      expect(authenticatedResponse).to.have.status(404);
      expect(authenticatedResponse.text).to.not.include(sentinelContent);
    }
  });

  it('keeps ordinary client assets public', () => {
    return chai.request(url)
      .get('/src/index.html')
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
