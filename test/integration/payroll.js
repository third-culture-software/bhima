/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

/*
 * The /multiplePayroll  API
 *
 * This test suite implements Payroll Process Managere.
 */
describe('test/integration/payroll the Multiple Payroll API', () => {

  const params = {
    periodPaie : 1,
    dateFrom : '2018-02-01',
    dateTo : '2018-02-28',
    employeeUuid : '75e09694-65f2-45a1-a8a2-8b025003d793',
  };

  const employees = [{
    employee_uuid : '6b4642a7-4577-4768-b6ae-1b3d38f0bbef',
    code : 'x500',
    hiring_date : '2016-01-01T00:00:00.000Z',
    nb_enfant : 0,
    individual_salary : null,
    account_id : 179,
    creditor_uuid : '42463ac9-b89e-4ba5-91ff-2920cde7f37e',
    display_name : 'CHARLE MAGNE DE FRANCE',
    sex : 'M',
    uuid : null,
    payroll_configuration_id : '1',
    currency_id : '2',
    payment_date : null,
    base_taxable : 0,
    basic_salary : 0,
    gross_salary : 0,
    grade_salary : 50,
    text : '1.1',
    net_salary : 0,
    working_day : 0,
    total_day : 0,
    daily_salary : 0,
    amount_paid : 0,
    status_id : 1,
    status : 'PAYROLL_STATUS.WAITING_FOR_CONFIGURATION',
    balance : 0,
  }, {
    employee_uuid : '75e69409-562f-a2a8-45a1-3d7938b02500',
    code : 'WWEFCB',
    hiring_date : '2016-01-01T00:00:00.000Z',
    nb_enfant : 0,
    individual_salary : 0,
    account_id : 179,
    creditor_uuid : '18dcada5-f149-4eea-8267-19c346c2744f',
    display_name : 'EMPLOYEE TEST 1',
    sex : 'F',
    uuid : null,
    payroll_configuration_id : '1',
    currency_id : '2',
    payment_date : null,
    base_taxable : 0,
    basic_salary : 0,
    gross_salary : 0,
    grade_salary : 50,
    text : '1.1',
    net_salary : 0,
    working_day : 0,
    total_day : 0,
    daily_salary : 0,
    amount_paid : 0,
    status_id : 1,
    status : 'PAYROLL_STATUS.WAITING_FOR_CONFIGURATION',
    balance : 0,
  }];

  const dataMultiConfiguration = {
    data : {
      employees,
      currencyId : 2,
    },
  };

  const dataConfiguration = {
    data : {
      currency_id : 2,
      off_days : 0,
      nb_holidays : 0,
      working_day : 20,
      value : {
        TPR : 100, PRI : 120, v_cher : 150, f_scol : 50, allc : 15,
      },
      employee :
     {
       uuid : '75e69409-562f-a2a8-45a1-3d7938b02500',
       code : 'WWEFCB',
       display_name : 'Employee Test 1',
       sex : 'F',
       dob : '1960-06-29T22:00:00.000Z',
       hiring_date : '2016-01-01T00:00:00.000Z',
       service_uuid : 1,
       nb_spouse : 0,
       nb_enfant : 0,
       grade_uuid : '9ee06e4a-7b59-48e6-812c-c0f8a00cf7d3',
       locked : null,
       text : '1.1',
       basic_salary : 50,
       fonction_id : 1,
       fonction_txt : 'Infirmier',
       service_txt : 'Test Service',
       hospital_no : 'SOF-14',
       phone : null,
       email : null,
       adresse : null,
       patient_uuid : 'd1d7f856-d414-4400-8b94-8ba9445a2bc0',
       bank : 'BCOL',
       bank_account : '00-99-88-77',
       individual_salary : 0,
       code_grade : 'A1',
       debtor_uuid : '76976710-27eb-46dd-b3f5-cb5eb4abbc92',
       debtor_text : 'Debiteur [Employee Test 1]',
       debtor_group_uuid : '4de0fe47-177f-4d30-b95f-cff8166400b4',
       creditor_uuid : '18dcada5-f149-4eea-8267-19c346c2744f',
       creditor_text : 'Personnel 2',
       creditor_group_uuid : 'b0fa5ed2-04f9-4cb3-92f7-61d6404696e7',
       account_id : 179,
       current_location_id : '1f162a10-9f67-4788-9eff-c1fea42fcc9b',
       origin_location_id : '1f162a10-9f67-4788-9eff-c1fea42fcc9b',
     },
      offDays : [],
      holidays : [],
      daysPeriod : { working_day : 20 },
      iprScales :
     [{
       id : 1,
       currency_id : 1,
       rate : 0,
       tranche_annuelle_debut : 0,
       tranche_annuelle_fin : 524160,
       tranche_mensuelle_debut : 0,
       tranche_mensuelle_fin : 43680,
       ecart_annuel : 524160,
       ecart_mensuel : 43680,
       impot_annuel : 0,
       impot_mensuel : 0,
       cumul_annuel : 0,
       cumul_mensuel : 0,
       taxe_ipr_id : 1,
     },
     {
       id : 2,
       currency_id : 1,
       rate : 15,
       tranche_annuelle_debut : 524160,
       tranche_annuelle_fin : 1428000,
       tranche_mensuelle_debut : 43680,
       tranche_mensuelle_fin : 119000,
       ecart_annuel : 903840,
       ecart_mensuel : 75320,
       impot_annuel : 135576,
       impot_mensuel : 11298,
       cumul_annuel : 135576,
       cumul_mensuel : 11298,
       taxe_ipr_id : 1,
     },
     {
       id : 3,
       currency_id : 1,
       rate : 20,
       tranche_annuelle_debut : 1428000,
       tranche_annuelle_fin : 2700000,
       tranche_mensuelle_debut : 119000,
       tranche_mensuelle_fin : 225000,
       ecart_annuel : 1272000,
       ecart_mensuel : 106000,
       impot_annuel : 254400,
       impot_mensuel : 21200,
       cumul_annuel : 389976,
       cumul_mensuel : 32498,
       taxe_ipr_id : 1,
     },
     {
       id : 4,
       currency_id : 1,
       rate : 22.5,
       tranche_annuelle_debut : 2700000,
       tranche_annuelle_fin : 4620000,
       tranche_mensuelle_debut : 225000,
       tranche_mensuelle_fin : 385000,
       ecart_annuel : 1920000,
       ecart_mensuel : 160000,
       impot_annuel : 432000,
       impot_mensuel : 36000,
       cumul_annuel : 821976,
       cumul_mensuel : 68498,
       taxe_ipr_id : 1,
     },
     {
       id : 5,
       currency_id : 1,
       rate : 25,
       tranche_annuelle_debut : 4620000,
       tranche_annuelle_fin : 7260000,
       tranche_mensuelle_debut : 385000,
       tranche_mensuelle_fin : 605000,
       ecart_annuel : 2640000,
       ecart_mensuel : 220000,
       impot_annuel : 660000,
       impot_mensuel : 55000,
       cumul_annuel : 1481980,
       cumul_mensuel : 123498,
       taxe_ipr_id : 1,
     },
     {
       id : 6,
       currency_id : 1,
       rate : 30,
       tranche_annuelle_debut : 7260000,
       tranche_annuelle_fin : 10260000,
       tranche_mensuelle_debut : 605000,
       tranche_mensuelle_fin : 855000,
       ecart_annuel : 3000000,
       ecart_mensuel : 250000,
       impot_annuel : 900000,
       impot_mensuel : 75000,
       cumul_annuel : 2381980,
       cumul_mensuel : 198498,
       taxe_ipr_id : 1,
     },
     {
       id : 7,
       currency_id : 1,
       rate : 32.5,
       tranche_annuelle_debut : 10260000,
       tranche_annuelle_fin : 13908000,
       tranche_mensuelle_debut : 855000,
       tranche_mensuelle_fin : 1159000,
       ecart_annuel : 3648000,
       ecart_mensuel : 304000,
       impot_annuel : 1185600,
       impot_mensuel : 98800,
       cumul_annuel : 3567580,
       cumul_mensuel : 297298,
       taxe_ipr_id : 1,
     },
     {
       id : 8,
       currency_id : 1,
       rate : 35,
       tranche_annuelle_debut : 13908000,
       tranche_annuelle_fin : 16824000,
       tranche_mensuelle_debut : 1159000,
       tranche_mensuelle_fin : 1402000,
       ecart_annuel : 2916000,
       ecart_mensuel : 243000,
       impot_annuel : 1020600,
       impot_mensuel : 85050,
       cumul_annuel : 4588180,
       cumul_mensuel : 382348,
       taxe_ipr_id : 1,
     },
     {
       id : 9,
       currency_id : 1,
       rate : 37.5,
       tranche_annuelle_debut : 16824000,
       tranche_annuelle_fin : 22956000,
       tranche_mensuelle_debut : 1402000,
       tranche_mensuelle_fin : 1913000,
       ecart_annuel : 6132000,
       ecart_mensuel : 511000,
       impot_annuel : 2299500,
       impot_mensuel : 191625,
       cumul_annuel : 6887680,
       cumul_mensuel : 573973,
       taxe_ipr_id : 1,
     },
     {
       id : 10,
       currency_id : 1,
       rate : 40,
       tranche_annuelle_debut : 22956000,
       tranche_annuelle_fin : 100000000000000,
       tranche_mensuelle_debut : 1913000,
       tranche_mensuelle_fin : 1913000,
       ecart_annuel : 0,
       ecart_mensuel : 0,
       impot_annuel : 0,
       impot_mensuel : 0,
       cumul_annuel : 6887680,
       cumul_mensuel : 573973,
       taxe_ipr_id : 1,
     }],
    },
  };

  const dataCommitment = {
    data : ['75e69409-562f-a2a8-45a1-3d7938b02500'],
  };

  const employeesNumber = 3;
  const workingDay = 20;

  it('GET /multiple_payroll returns the pay situation for employees in a period', () => {
    const conditions = { payroll_configuration_id : params.periodPaie };

    return agent.get('/multiple_payroll')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, employeesNumber);
      })
      .catch(helpers.handler);
  });

  // eslint-disable-next-line
  it('GET /multiple_payroll/:id/configuration returns configuration of rubrics and other elements required for the configuration of the payment', () => {
    const path = '/multiple_payroll/'.concat(params.periodPaie, '/configuration');

    return agent.get(path)
      .query(params)
      .then((res) => {
        const data = res.body;

        // Check the number of Working Day
        expect(data[7][0].working_day).to.equal(workingDay);
      })
      .catch(helpers.handler);
  });

  it('POST /multiple_payroll/:id/configuration should Set Configuration of Paiement for Multiple Patient', () => {
    return agent.post('/multiple_payroll/'.concat(params.periodPaie, '/multiConfiguration'))
      .send(dataMultiConfiguration)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('POST /multiple_payroll/:id/configuration should Set Configuration of Paiement', () => {
    return agent.post('/multiple_payroll/'.concat(params.periodPaie, '/configuration'))
      .send(dataConfiguration)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('POST /multiple_payroll/:id/commitment should Set Configuration of Paiement', () => {
    return agent.post('/multiple_payroll/'.concat(params.periodPaie, '/commitment'))
      .send(dataCommitment)
      .then((res) => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });
});
