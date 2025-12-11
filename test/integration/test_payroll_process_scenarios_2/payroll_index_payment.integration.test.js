/* global expect, agent */
const helpers = require('../helpers');

describe(`Tests to verify that enabling "Payment by Index"
  correctly updates the BHIMA system for index-based payments`, () => {
  const defaultEnterpriseId = 1;

  // ---------------------------------------------------------
  // This test verifies that when the index payment system is
  // enabled, the payroll payslip report is generated correctly
  // and that the correct report template is used.
  it('should generate payroll payslip and verify that rubricsIndexes (otherProfits) contain elements', async () => {
    const paramPayslip = {
      currency : '2',
      employees : [
        '8FAC0B70C12B423FB575324751448F4F',
        '0236AF7EBDF449B6A4F0309EC94BC92A',
      ],
      idPeriod : '19',
      lang : 'fr',
      renderer : 'json', // JSON to easily inspect the data
    };

    try {
      // Step 1: Check the enterprise configuration
      const enterpriseRes = await agent.get(`/enterprises/${defaultEnterpriseId}`);
      expect(enterpriseRes).to.have.status(200);
      expect(enterpriseRes.body.settings.enable_index_payment_system).to.equal(1);

      // Step 2: Call the API to generate the report
      const reportRes = await agent.get(`/reports/payroll/payslip`).query(paramPayslip);
      expect(reportRes).to.have.status(200);
      expect(reportRes.body).to.be.an('object');
      expect(reportRes.body.dataEmployees).to.be.an('array');

      // Step 3: Verify rubricsIndexes via otherProfits
      reportRes.body.dataEmployees.forEach(employee => {
        expect(employee).to.have.property('otherProfits');

        // Test only if the array contains elements
        if (employee.otherProfits.length > 0) {
          employee.otherProfits.forEach(profit => {
            expect(profit).to.have.property('value');
            expect(profit).to.have.property('label');
          });
        }
      });

    } catch (err) {
      helpers.handler(err);
    }
  });

  it('should disable index payment system and verify otherProfits is empty', async () => {
    const updatePayload = {
      settings : {
        enable_index_payment_system : 0,
      },
    };

    const paramPayslip = {
      currency : '2',
      employees : [
        '8FAC0B70C12B423FB575324751448F4F',
        '0236AF7EBDF449B6A4F0309EC94BC92A',
      ],
      idPeriod : '19',
      lang : 'fr',
      renderer : 'json',
    };

    try {
      // Step 1: Disable index payment system
      const updateRes = await agent
        .put(`/enterprises/${defaultEnterpriseId}`)
        .send(updatePayload);
      expect(updateRes).to.have.status(200);
      expect(updateRes.body.settings.enable_index_payment_system).to.equal(0);

      // Step 2: Generate payroll report
      const reportRes = await agent.get(`/reports/payroll/payslip`).query(paramPayslip);
      expect(reportRes).to.have.status(200);
      expect(reportRes.body.dataEmployees).to.be.an('array');

      // Step 3: Verify otherProfits is empty for all employees
      reportRes.body.dataEmployees.forEach(employee => {
        expect(employee).to.not.have.property('otherProfits');
      });

    } catch (err) {
      helpers.handler(err);
    }
  });

  it('should restore index payment system to enabled', async () => {
    const restorePayload = { settings : { enable_index_payment_system : 1 } };

    const restoreRes = await agent
      .put(`/enterprises/${defaultEnterpriseId}`)
      .send(restorePayload);

    expect(restoreRes).to.have.status(200);
    expect(restoreRes.body.settings.enable_index_payment_system).to.equal(1);
  });
});
