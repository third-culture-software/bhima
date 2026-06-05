
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
      periodDateTo : params.dateTo,
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

  const paramGeneralReport = {
    currency_id : '2',
    displayValues : '',
    employees : [
'8fac0b70-c12b-423f-b575-324751448f4f',
'0236af7e-bdf4-49b6-a4f0-309ec94bc92a',
'e855792b-6de0-434f-94a5-9a13a18fd045',
'47b2b330-cc27-430f-be3f-8b3a14be07e2',
'50894edf-9dfe-4a04-9986-611656b2ea0a',
'd0cddef1-7234-498c-9a8e-e283800ccdc1',
'7315de44-a80c-4f06-9814-5ff027919485',
'f67609f7-3815-4298-bfef-95f8bc73a4da',
'02e4fe5b-c16c-4aa2-bf37-9a7fc097855c',
'36fbab26-3f88-442e-9d02-079b09fcd957',
'e93f7c51-0ac7-4b42-9708-bc89a616127d',
'6ed2c53d-c846-450b-8e9f-9e81a3099f66',
'2991ab31-1348-4d57-a7d4-e017ecd3cb43',
'f7ae6449-4a78-4e67-856d-5f7f28030659',
'113fdeb6-16ca-4192-aaf9-18d76b36c3ec',
'1008bbba-f41f-449a-87f5-6f2ba1ee6ef2',
'da7c4853-0981-4bc2-a1b6-7276d95794f0',
'93694df0-e1dd-4d11-a110-b0831dd329e3',
'31b13da8-9d37-4f56-89fb-0383db345dad',
'5dbec961-b42d-4861-8b09-f4e7436ccb78',
'ffe49ab0-2b5a-4ff6-8108-0d53bf8caef1',
'50e52ade-9733-4b47-9cea-dcb74471aedd',
'f40b3859-e623-438b-a2e9-94776e4cf8bc',
'f4a443a9-1c08-4bab-9fae-2feeb69ab4a4',
'9e0594ea-d523-47fc-ade1-6a84b3ebae69',
'f937055e-59d5-442d-a1a8-b413d566f3d6',
'bdc44ad7-a773-4d06-b6de-f202dd9dd16a',
'68ec6652-a4d9-4e83-88c1-b1507ea8c54e',
'a3395413-5767-410d-ac64-75dc73572dd7',
'8ffc239f-432c-4df0-9162-001989ab5c6c',
'62684141-0b5c-4e95-a38c-89c1b064432a',
'95e24bac-d46a-407b-b954-a79adc00cbd3',
'5133240d-4cc5-41a6-bec5-4d9ddd3bd4c9',
'671a40fd-e9ef-4f69-9445-36f11cd794fd',
'76e864ee-40fc-4213-a892-5d3d894b6393',
'fc5c0657-88e5-4ca8-965c-b7054e44d403',
'53a2900c-edc1-4644-b20d-614144a37281',
'2a22c023-7752-4a65-a19b-12ff419e5c53',
'ea962bf9-8d08-4984-9b5f-db6f84cb0d4a',
'e3ed8721-a0c8-4e09-8f4e-6bbb8ed67842',
'1b7c2651-c371-4258-839f-6e1119003824',
'a9d41a0b-815f-4632-8224-6dba6a661b86',
'b60b0f14-9259-4a3c-8964-680bbe950b5e',
'9d46c71d-e5a9-4505-87ad-a9545c68bae3',
'a327862d-9434-4f04-8983-f44e366f6b21',
'503919e3-f48a-4347-9bd7-418529207a76',
'baabe3fd-bd44-45cf-9732-f57a6b00a79d',
'47699612-d912-40ef-ab93-a03e29d24607',
'9a364fd6-3510-408d-9675-b79daa50a456',
'8cf02782-c2ea-4e68-a14d-a94fb3ca4c33',
'2845f481-d30e-4798-8520-6c5c5a44d8eb',
'7431b3fc-4913-4951-b573-a7a73406b1d8',
'bd2be9fb-4c03-4a28-a267-624da81fdd74',
'3bebc8e5-1bdd-4c75-b669-019b5b2ed9f8',
'9d5135da-4f75-42f4-9eed-e0e47234bda6',
'482700ca-8ac8-4628-a6ba-6599ee3f0294',
'aa417a3e-40ac-4aed-a50f-42156079d886',
'5243bae8-8f63-4192-9353-a1584162bc67',
'b15364f4-dcfe-4978-88af-572e5080207f',
'd3fc3111-efeb-4fac-b2bd-37ed305e3de8',
'a9d703c5-595e-4d4d-a516-64d0991b04bc',
'905d67ec-dc39-4462-9102-4704e1e78c32',
'fc6d3aa4-49e2-485a-96f7-02621f902238',
'ca5296bb-ad5c-4e6d-a897-02be0bf7afd7',
'b40a3794-79d4-438f-89cb-d85cea739482',
'04a6b2f1-7331-4614-b19a-8d23fc8e3288',
'79d18e15-d679-46f9-8c4d-48372787b712',
'c085631c-7cbf-40b1-a55f-4d253b11e948',
'520d88b8-f085-40ec-a4c4-85475f4290b3',
'1a1b6958-b251-4053-922c-13a248e8baf7',
'75b12df8-2a16-4f26-9a1c-003551d1a91d',
'68d2059e-506a-417a-9de1-58561c57ecd1',
'28b33f0d-c55b-41d1-8b98-810e1dcaa405',
'098dffab-80b2-4b87-ad76-244e95d1dbe9',
'00f9e979-9cf7-4686-b092-95f0cfb17061',
'e943f91c-a22e-473f-9fd3-3e35331805b9',
'b25c5032-746c-45d1-9f0d-e5532bef5817',
'38180bbb-48cf-4ad1-9881-587d7a58ed64',
'33025272-1949-4e53-bbd3-d834580fe5dd',
'1022f9aa-1c3b-47d2-a077-591609b95c5f',
'ed259a56-617f-4bbb-bb33-02cc2f699792',
'3a4f1c53-54e8-4d9b-b089-66db2fb2a14f',
'c8aea311-bcdb-4de8-bde2-9706ddc13274',
'8836cc7f-624a-4e19-9e43-516c64d14894',
'a2714a42-e907-4e53-9ee8-a907b7b22382',
'a4846c26-964e-46f7-8051-44de2f57e187',
'cdf219ce-236d-42e8-bf33-1cd29d497e42',
'903377a8-5e74-4705-a239-d50794faaf49',
'25b12800-7e4c-47c7-8fbc-e5c0e6f46fd1',
'ace76ba5-44c9-41f1-b942-c7c49b24d27c',
'4f96ed7d-ea65-4bbf-9c77-41fe7712f531',
'fb28e427-3a00-4b71-ad18-01b73293dd38',
'114f715e-9df1-4500-8503-ddfdc5326974',
'7867051b-2cf4-4538-a3e1-4d45813f86e4',
'435c6e32-dcb2-4b46-a962-d85572e599e8',
'914c7806-bdee-4499-9b4a-6b97ff7c585a',
    ],
    lang : 'fr',
    payroll_configuration_id : '19',
    renderer : 'json',
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

  it('GET /reports/payroll/payslip get General Report', () => {
    return agent.get('/reports/payroll/payslip/')
      .query(paramGeneralReport)
      .then((res) => {
        const totalBasicSalary = Math.round(res.body.total_basic_salary * 100) / 100;
        expect(totalBasicSalary).to.equal(6614.02); // 6614.020000000002

        const totalNetSalary = Math.round(res.body.total_net_salary * 100) / 100;
        expect(totalNetSalary).to.equal(6055.98); // 6055.9800000000005
      })
      .catch(helpers.handler);
  });

});
