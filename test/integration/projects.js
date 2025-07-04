/* global expect, agent */
/* eslint-disable no-unused-expressions */
const fs = require('fs');
const helpers = require('./helpers');

/*
 * The /projects API
 *
 * This test suite implements full CRUD on the /projects API.
 */
describe('test/integration/projects The projects API', () => {
  // project we will add during this test suite.
  const project = {
    abbr : 'TMP',
    name : 'Temporary Project',
    enterprise_id : 1,
    zs_id : 759,
    locked : 0,
  };

  const file = './test/fixtures/file.jpg';

  const PROJECT_KEY = [
    'id',
    'name',
    'abbr',
    'enterprise_id',
    'zs_id',
    'locked',
    'logo',
  ];

  /* number of projects defined in the database */
  const numProjects = 3;

  it('GET /projects returns a list of projects', () => {
    return agent
      .get('/projects')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body[0]).to.have.keys('id', 'name');
      })
      .catch(helpers.handler);
  });

  it('GET /projects/:id will send back a 404 if the projects id does not exist', () => {
    return agent
      .get('/projects/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /projects/:id will send back a 404 if the projects id is a string', () => {
    return agent
      .get('/projects/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /projects/:id should return a single JSON project', () => {
    return agent
      .get('/projects/1')
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body.id).to.exist;
      })
      .catch(helpers.handler);
  });

  it('GET /projects?complete=1 returns a complete list of project', () => {
    return agent
      .get('/projects?complete=1')
      .then((res) => {
        helpers.api.listed(res, numProjects);
        expect(res.body[0]).to.contain.all.keys(PROJECT_KEY);
      })
      .catch(helpers.handler);
  });

  it('GET /projects?locked=0 returns a complete list of unlocked projects', () => {
    return agent
      .get('/projects?locked=0')
      .then((res) => {
        helpers.api.listed(res, numProjects);
        expect(res.body[0]).to.contain.all.keys(PROJECT_KEY);
      })
      .catch(helpers.handler);
  });

  it('GET /projects?locked=1 returns a complete list of locked projects', () => {
    return agent
      .get('/projects?locked=1')
      .then((res) => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

  it('POST /projects should create a new project', () => {
    return agent
      .post('/projects')
      .send(project)
      .then((res) => {
        helpers.api.created(res);
        return agent.get(`/projects/${res.body.id}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.name).to.equal(project.name);
        project.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('POST /projects should create a new project with a logo', () => {
    return agent.post('/projects')
      .type('form')
      .field('name', project.name.concat(' with logo'))
      .field('abbr', project.abbr.concat(' WL'))
      .field('enterprise_id', project.enterprise_id)
      .field('zs_id', project.zs_id)
      .field('locked', project.locked)
      .attach('logo', fs.createReadStream(file), 'file.jpg')
      .then(innerRes => {
        expect(innerRes).to.have.status(201);
        return agent.get(`/projects/${innerRes.body.id}`);
      })
      .then(innerRes => {
        expect(innerRes).to.have.status(200);
        expect(innerRes).to.be.json;
        expect(innerRes.body.name).to.equal(project.name.concat(' with logo'));
        expect(innerRes.body.logo).to.exist; // we cannot check the filename since the filename is changed by the server
        const filepath = 'client/upload/pics/';
        expect(innerRes.body.logo.startsWith(filepath)).to.be.true;
        expect(innerRes.body.logo.length).to.equal(filepath.length + 32); // the length of the filename is 32
      })
      .catch(helpers.handler);
  });

  it('PUT /projects should update an existing project', () => {
    return agent
      .put(`/projects/${project.id}`)
      .send({ name : 'Temp Project' })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(PROJECT_KEY);
        expect(res.body.name).to.not.equal(project.name);
      })
      .catch(helpers.handler);
  });

  it('DELETE /projects/:id will send back a 404 if the projects id does not exist', () => {
    return agent
      .delete('/projects/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /projects/:id will send back a 404 if the projects id is a string', () => {
    return agent
      .delete('/projects/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /projects/:id should delete an existing and unused project', () => {
    return agent
      .delete(`/projects/${project.id}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/projects/${project.id}`);
      })
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
