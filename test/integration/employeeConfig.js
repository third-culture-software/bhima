/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /payroll/employee_configuration  API
 *
 * This test suite implements full CRUD on the /payroll/employee_configuration  API.
 */
describe('test/integration/payroll employee_config/ The Employee Payroll Configuration  API', () => {
  // Employee Payroll Configuration we will add during this test suite.

  const employeeConfig = {
    label : 'employee configuration 2017',
    configuration : [],
  };

  const employeeConfigUpdate = {
    label : 'employee configuration 2018',
  };

  const defaultEmployeeConfiguration = 1;

  const configEmployee = {
    configuration : [
      '6b4642a7-4577-4768-b6ae-1b3d38f0bbef',
      '75e09694-65f2-45a1-a8a2-8b025003d793',
      '75e69409-562f-a2a8-45a1-3d7938b02500',
    ],
  };

  const NUM_EMPLOYEE_CONFIG = 13;

  it('GET /employee_config returns a list of employee configurations ', () => {
    return agent.get('/employee_config')
      .then((res) => {
        helpers.api.listed(res, NUM_EMPLOYEE_CONFIG);
      })
      .catch(helpers.handler);
  });

  it('POST /employee_config should create a new employee configuration', () => {
    return agent.post('/employee_config')
      .send(employeeConfig)
      .then((res) => {
        employeeConfig.id = res.body.id;
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('GET /employee_config/:ID should not be found for unknown id', () => {
    return agent.get('/employee_config/unknownEmployee')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /employee_config should update an existing employee configuration', () => {
    return agent.put(`/employee_config/${employeeConfig.id}`)
      .send(employeeConfigUpdate)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal('employee configuration 2018');
      })
      .catch(helpers.handler);
  });

  it('GET /employee_config/:ID returns a single employee configuration', () => {
    return agent.get(`/employee_config/${employeeConfig.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('DELETE /employee_config/:ID will send back a 404 if the employee configuration does not exist', () => {
    return agent.delete('/employee_config/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /employee_config/:ID will send back a 400 if the employee configuration id is a string', () => {
    return agent.delete('/employee_config/str')
      .then((res) => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('DELETE /employee_config/:ID should delete an employee configuration ', () => {
    return agent.delete(`/employee_config/${employeeConfig.id}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });

  // INTEGRATION TEST FOR SETTING EMPLOYEE IN CONFIGURATION
  it('POST /employee_config/:ID/setting should Set Employees in Configuration', () => {
    return agent.post(`/employee_config/${defaultEmployeeConfiguration}/setting`)
      .send(configEmployee)
      .then((res) => {
        expect(res).to.have.status(201);
        return agent.get(`/employee_config/${defaultEmployeeConfiguration}/setting`);
      })
      .then(res => {
        helpers.api.listed(res, 3);
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
      })
      .catch(helpers.handler);
  });


});
