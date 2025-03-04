/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /payroll API
 *
 * This test suite implements full CRUD on the /payroll  API.
 */
describe('test/integration/payrollConfig The payroll Config API', () => {
  // Payroll Configuration we will add during this test suite.

  const payrollConfig = {
    label : 'Account Configuration 2017',
    dateFrom : '2017-12-01',
    dateTo : '2017-12-31',
    config_rubric_id : 1,
    config_accounting_id : 1,
    config_weekend_id : 1,
    config_employee_id : 1,
  };

  const PayrollConfigUpdate = {
    label : 'Janvier 2018',
    dateFrom : '2018-01-01',
    dateTo : '2018-01-31',
  };

  const NUM_CONFIG_PAYROLL = 18;

  it('GET /PAYROLL_CONFIG returns a list of Payroll Configurations ', () => {
    return agent.get('/payroll_config')
      .then((res) => {
        helpers.api.listed(res, NUM_CONFIG_PAYROLL);
      })
      .catch(helpers.handler);
  });

  it('POST /PAYROLL_CONFIG should create a new Payroll Configuration', () => {
    return agent.post('/payroll_config')
      .send(payrollConfig)
      .then((res) => {
        payrollConfig.id = res.body.id;
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('GET /PAYROLL_CONFIG/:ID should not be found for unknown id', () => {
    return agent.get('/payroll_config/unknownPayrollConfig')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /PAYROLL_CONFIG  should update an existing Payroll Configuration', () => {
    return agent.put('/payroll_config/'.concat(payrollConfig.id))
      .send(PayrollConfigUpdate)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal(PayrollConfigUpdate.label);
      })
      .catch(helpers.handler);
  });

  it('GET /PAYROLL_CONFIG/:ID returns a single Payroll Configuration', () => {
    return agent.get('/payroll_config/'.concat(payrollConfig.id))
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('DELETE /PAYROLL_CONFIG/:ID will send back a 404 if the Payroll Configuration does not exist', () => {
    return agent.delete('/payroll_config/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /PAYROLL_CONFIG/:ID will send back a 404 if the Payroll Configuration is a string', () => {
    return agent.delete('/payroll_config/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /PAYROLL_CONFIG/:ID should delete an Payroll Configuration ', () => {
    return agent.delete('/payroll_config/'.concat(payrollConfig.id))
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

});
