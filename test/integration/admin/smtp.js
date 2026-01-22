/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('../helpers');

/*
 * The /smtp API
 *
 * This test suite implements full CRUD on the /smtp API.
 */
describe('test/integration/smtp SMTP Configuration', function smptTest() {

  // Ensure the SMTP server has ample time to connect
  this.timeout(120500);

  const newSmtpConfig = {
    smtp_host : 'smtp.test.com',
    smtp_port : 587,
    smtp_secure : 0,
    smtp_username : 'test@example.com',
    smtp_password : 'testpassword123',
    from_address : 'noreply@test.com',
    from_name : 'BHIMA Test',
  };

  const badSmtpConfig = {
    smtp_host : 'smtp.test.com',
    // missing required fields
  };

  const updatedConfig = {
    smtp_host : 'smtp.updated.com',
    smtp_port : 465,
    smtp_secure : 1,
    from_name : 'BHIMA Updated',
  };

  it('GET /smtp returns a list of SMTP configurations', () => {
    return agent.get('/smtp')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('array');
      })
      .catch(helpers.handler);
  });

  it('POST /smtp will add a valid SMTP configuration', () => {
    return agent.post('/smtp')
      .send(newSmtpConfig)
      .then(res => {
        helpers.api.created(res);

        // cache the config id
        newSmtpConfig.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('POST /smtp will reject an invalid SMTP configuration', () => {
    return agent.post('/smtp')
      .send(badSmtpConfig)
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('POST /smtp with empty object will send 400 error code', () => {
    return agent.post('/smtp')
      .send({})
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('GET /smtp/:id will find the newly added SMTP configuration', () => {
    return agent.get(`/smtp/${newSmtpConfig.id}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.smtp_host).to.equal(newSmtpConfig.smtp_host);
        expect(res.body.smtp_username).to.equal(newSmtpConfig.smtp_username);
        expect(res.body.from_address).to.equal(newSmtpConfig.from_address);
      })
      .catch(helpers.handler);
  });

  it('PUT /smtp/:id will update the newly added SMTP configuration', () => {
    return agent.put(`/smtp/${newSmtpConfig.id}`)
      .send(updatedConfig)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.smtp_host).to.equal(updatedConfig.smtp_host);
        expect(res.body.smtp_port).to.equal(updatedConfig.smtp_port);
        expect(res.body.smtp_secure).to.equal(updatedConfig.smtp_secure);

        // re-query the database
        return agent.get(`/smtp/${newSmtpConfig.id}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.smtp_host).to.equal(updatedConfig.smtp_host);
        expect(res.body.from_name).to.equal(updatedConfig.from_name);
      })
      .catch(helpers.handler);
  });

  it('POST /smtp/test-connection will test SMTP connection with valid config', () => {
    const testConfig = {
      smtp_host : 'smtp.gmail.com',
      smtp_port : 587,
      smtp_secure : 0,
      smtp_username : 'test@gmail.com',
      smtp_password : 'invalidpassword', // This will fail but shouldn't crash
    };

    return agent.post('/smtp/test-connection')
      .send(testConfig)
      .then(res => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body.success).to.equal(false);
        expect(res.body.message).to.be.a('string');
      })
      .catch(helpers.handler);
  });

  it('POST /smtp/test-connection will reject invalid test configuration', () => {
    const invalidTestConfig = {
      smtp_host : '', // empty host
      smtp_port : 587,
    };

    return agent.post('/smtp/test-connection')
      .send(invalidTestConfig)
      .then(res => {
        expect(res).to.have.status(400);
        expect(res).to.be.json;
        expect(res.body.success).to.equal(false);
      })
      .catch(helpers.handler);
  });

  it('DELETE /smtp/:id will delete the SMTP configuration', () => {
    return agent.delete(`/smtp/${newSmtpConfig.id}`)
      .then(res => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });

  it('GET /smtp/:id will return 404 for deleted configuration', () => {
    return agent.get(`/smtp/${newSmtpConfig.id}`)
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /smtp/:id will return 404 for non-existent configuration', () => {
    return agent.delete('/smtp/999999')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

});
