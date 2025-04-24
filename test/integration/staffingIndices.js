/* eslint no-unused-expressions:off */
/* global expect, agent */
const moment = require('moment');
const helpers = require('./helpers');

/*
 * The /staffing_indices API
 *
 * This test suite implements full CRUD on the /staffing_indices API.
 */
describe('test/integration/staffingIndices The staffing indices API', () => {
  const newIndice = {
    uuid : 'd2f7ef71-6f3e-44bd-8056-378c5ca26e20',
    grade_uuid : '9EE06E4A7B5948E6812CC0F8A00CF7D3',
    employee_uuid : '75E0969465F245A1A8A28B025003D793',
    fonction_id : 2,
    function_indice : 125,
    grade_indice : 125,
  };

  const newIndiceUpdate = {
    uuid : 'd2f7ef71-6f3e-44bd-8056-378c5fa26e20',
    grade_uuid : '71E9F21CD9B111E58AB778EB2F2A46E0',
    employee_uuid : '75E69409562FA2A845A13D7938B02500',
    fonction_id : 1,
    function_indice : 10,
    grade_indice : 20,
  };

  const newIndiceTest = {
    uuid : 'a2g7ef71-6f3e-44bd-8056-378c5fa26e30',
    employee_uuid : '75E69409562FA2A845A13D7938B02500',
    grade_uuid : '71E9F21CD9B111E58AB778EB2F2A46E0',
    fonction_id : 1,
    function_indice : 100,
    grade_indice : 20,
  };

  const staffingGradeIndice = {
    uuid : '71e9f21c-d9b1-11e5-8ab7-78eb2f2a46e0',
    grade_uuid : '9ee06e4a-7b59-48e6-812c-c0f8a00cf7d3',
    value : 80,
  };

  const staffingFunctionIndice = {
    uuid : '9ee06e4a-7b59-48e6-812c-c0f8a00cf7d3',
    fonction_id : 1,
    value : 80,
  };

  const dataSetUpConfiguration = {
    payroll_configuration_id : 6,
    pay_envelope : 1200,
    working_days : '26',
  };

  const paramsMultipayrollIndice = {
    currency_id : 2,
    payroll_configuration_id : 6,
  };

  const year = new Date().getFullYear();
  const datePlus2Year = moment().add(2, 'year').format('YYYY-MM-DD');

  const datePlus2YearSub1Month = moment(datePlus2Year).clone().subtract(1, 'months').format('YYYY-MM-DD');
  const datePlus2YearSub1MonthBegin = moment(datePlus2YearSub1Month).clone().startOf('month').format('YYYY-MM-DD');
  const datePlus2YearSub1MonthEnd = moment(datePlus2YearSub1Month).clone().endOf('month').format('YYYY-MM-DD');

  const yearPlus2 = year + 2;

  const payrollConfigYearPlus2Sub1Month = {
    label : `Account Configuration ${yearPlus2} substract one month`,
    dateFrom : datePlus2YearSub1MonthBegin,
    dateTo : datePlus2YearSub1MonthEnd,
    config_rubric_id : 2,
    config_accounting_id : 1,
    config_weekend_id : 1,
    config_employee_id : 2,
  };

  it('POST /staffing_indices add a new staffing indice', () => {
    return agent.post('/staffing_indices')
      .send(newIndice)
      .then(res => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /staffing_i8', () => {
    return agent.get('/staffing_indices')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.length(1221);
      })
      .catch(helpers.handler);
  });

  it('PUT /staffing_indices update value', () => {
    return agent.put(`/staffing_indices/${newIndice.uuid}`)
      .send(newIndiceUpdate)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('POST /staffing_indices add a test indice', () => {
    return agent.post('/staffing_indices')
      .send(newIndiceTest)
      .then(res => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('DELETE /staffing_indices add a test indice', () => {
    return agent.delete(`/staffing_indices/${newIndiceTest.uuid}`)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  // staffing_grade_indices
  it('DELETE /staffing_grade_indices delete a test indice', () => {
    return agent.delete(`/staffing_grade_indices/${staffingGradeIndice.uuid}`)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('POST /staffing_grade_indices add a new staffing indice', () => {
    return agent.post('/staffing_grade_indices')
      .send(staffingGradeIndice)
      .then(res => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /staffing_grade_indices returns a list of staffing grade indices(3 records)', () => {
    return agent.get('/staffing_grade_indices')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.length(19);
      })
      .catch(helpers.handler);
  });

  // staffing function indices
  it('DELETE /staffing_function_indices delete a test indice', () => {
    return agent.delete(`/staffing_function_indices/${staffingFunctionIndice.uuid}`)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('POST /staffing_function_indices add a new staffing indice', () => {
    return agent.post('/staffing_function_indices')
      .send(staffingFunctionIndice)
      .then(res => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /staffing_function_indices returns a list of staffing function indices(2 records)', () => {
    return agent.get('/staffing_function_indices')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.length(2);
      })
      .catch(helpers.handler);
  });

  it('POST /multiple_payroll_indice/parameters/ should create staffing indices Set up for payment', () => {
    return agent.post('/multiple_payroll_indice/parameters/')
      .send(dataSetUpConfiguration)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /multiple_payroll_indice/ returns a list of ', () => {
    return agent.get('/multiple_payroll_indice/')
      .query(paramsMultipayrollIndice)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.employees[0].rubrics[8].rubric_abbr).to.equal('MBP-IND');
        expect(res.body.employees[0].rubrics[8].rubric_value).to.equal(622.74);

        expect(res.body.employees[1].rubrics[10].rubric_abbr).to.equal('MBP-IND');
        expect(res.body.employees[1].rubrics[10].rubric_value).to.equal(577.26);
      })
      .catch(helpers.handler);
  });

  // Checking the increase in base indices when creating a futuristic pay period
  it(`POST /PAYROLL_CONFIG should Payroll Configuration Year+2 for Checking
    the increase in base indices when creating a futuristic pay period`, () => {
    return agent.post('/payroll_config')
      .send(payrollConfigYearPlus2Sub1Month)
      .then((res) => {
        payrollConfigYearPlus2Sub1Month.id = res.body.id;
        helpers.api.created(res);

        // To test the new functionality intended to increase the base indices,
        // the system will first calculate the number of years of employee seniority
        // in relation to the pay period as well as the difference in years between
        // the last increment of the base index by in relation to the pay period,
        // and if this difference is greater than zero, the basic index will be
        // incremented as a percentage proportionally to the number of years.

        //
        return agent.get('/staffing_indices')
          .then(res2 => {
            expect(res2).to.have.status(200);
            expect(res2.body).to.be.an('array');

            let checkIncrementationGradeIndice = 0;

            res2.body.forEach(element => {
              // For the following example the first was hired on January 27, 2022, and
              // its last base index dates from February 27, 2024 and it is 66
              // The pay period is January 2026
              // The system will first calculate their year of seniority in relation to the pay period
              // Seniority = (2026-01-31) - (2022-01-27) is equal to 4 years (1)
              // Last increment = (2024-02-27) - (2022-01-27) is equal to 2 years (2)
              // Base Index Growth Rate being 5%, the base index of this employee will be increased in
              // accordance with the difference in years (1)-(2) => 4 years - 2 years = 2 years,
              // - Year 1: 66 + (66 x 0.05) = 69.03
              // - Year 2: 69.03 + (69.03 x 0.05) = 72.77 which the system will round to 73
              if (element.grade_indice === 73) {
                checkIncrementationGradeIndice++;
              }

              // For the following example the second was hired on february 27, 2022, and
              // its last base index dates from February 27, 2024 and it is 138
              // The pay period is January 2026
              // The system will first calculate their year of seniority in relation to the pay period
              // Seniority = (2026-01-31) - (2022-02-27) is equal to 3 years (1)
              // Last increment = (2024-02-27) - (2022-02-27) is equal to 2 years (2)
              // Base Index Growth Rate being 5%, the base index of this employee will be increased in
              // accordance with the difference in years (1)-(2) => 3 years - 2 years = 1 year
              // - Year 1: 138 + (138 x 0.05) = 144.9 which the system will round to 145
              if (element.grade_indice === 145) {
                checkIncrementationGradeIndice++;
              }

            });

            expect(checkIncrementationGradeIndice).to.equal(4);
            expect(res2.body).to.have.length(1224);
          })
          .catch(helpers.handler);
      })
      .catch(helpers.handler);
  });
});
