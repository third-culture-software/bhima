const { expect } = require('chai');
const moment = require('moment');
const { processRubric } = require('../../../server/controllers/payroll/multiplePayroll/processRubric');

describe('processRubric integration test with example employee data', () => {
  
  const req = {
    body: {
      data: {
        employee: {
          uuid: 'emp-uuid',
          code: 'EMP001',
          basic_salary: 1000,
          individual_salary: null,
          nb_enfant: 2,
          hiring_date: '2020-01-01',
        },
        periodDateTo: '2025-12-31',
        value: { BASE: 100 }
      }
    }
  };

  it('should calculate seniority bonus correctly for employee', () => {
    const rubric = {
      is_seniority_bonus: 1,
      is_family_allowances: 0,
      value: 0.05, // 5% of base salary per year
      is_percent: 0,
      abbr: 'SENIORITY'
    };

    const basicSalary = req.body.data.employee.basic_salary;

    // Calculate seniority using moment to consider full date (years, months, days)
    const hiringDate = req.body.data.employee.hiring_date;
    const periodDateTo = req.body.data.periodDateTo;
    const yearsOfSeniority = moment(periodDateTo).diff(moment(hiringDate), 'years');

    const result = processRubric(rubric, {
      basicSalary,
      yearsOfSeniority,
      nbChildren: req.body.data.employee.nb_enfant,
      inputValue: 0,
      enterpriseExchangeRate: 1,
      DECIMAL_PRECISION: 2
    });

    // Expected calculation: 1000 * 5 * 0.05 = 250
    expect(result).to.equal(250);
  });

  it('should calculate family allowance correctly for employee', () => {
    const rubric = {
      is_seniority_bonus: 0,
      is_family_allowances: 1,
      value: 50, // 50 per child
      is_percent: 0,
      abbr: 'FAMILY'
    };

    const result = processRubric(rubric, {
      basicSalary: req.body.data.employee.basic_salary,
      yearsOfSeniority: 5,
      nbChildren: req.body.data.employee.nb_enfant,
      inputValue: 0,
      enterpriseExchangeRate: 1,
      DECIMAL_PRECISION: 2
    });

    // Expected calculation: 50 * 2 children = 100
    expect(result).to.equal(100);
  });

  it('should use input value if rubric is not seniority or family allowance', () => {
    const rubric = {
      is_seniority_bonus: 0,
      is_family_allowances: 0,
      value: 0,
      is_percent: 0,
      abbr: 'BASE'
    };

    const result = processRubric(rubric, {
      basicSalary: 1000,
      yearsOfSeniority: 5,
      nbChildren: 2,
      inputValue: 123.456,
      enterpriseExchangeRate: 1,
      DECIMAL_PRECISION: 2
    });

    expect(result).to.equal(123.46); // rounded to 2 decimal places
  });

});
