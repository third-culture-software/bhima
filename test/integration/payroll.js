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

  const paramGeneralReport = {
    currency_id : '2',
    displayValues : '',
    employees : [
      '8FAC0B70C12B423FB575324751448F4F',
      '0236AF7EBDF449B6A4F0309EC94BC92A',
      'E855792B6DE0434F94A59A13A18FD045',
      '47B2B330CC27430FBE3F8B3A14BE07E2',
      '50894EDF9DFE4A049986611656B2EA0A',
      'D0CDDEF17234498C9A8EE283800CCDC1',
      '7315DE44A80C4F0698145FF027919485',
      'F67609F738154298BFEF95F8BC73A4DA',
      '02E4FE5BC16C4AA2BF379A7FC097855C',
      '36FBAB263F88442E9D02079B09FCD957',
      'E93F7C510AC74B429708BC89A616127D',
      '6ED2C53DC846450B8E9F9E81A3099F66',
      '2991AB3113484D57A7D4E017ECD3CB43',
      'F7AE64494A784E67856D5F7F28030659',
      '113FDEB616CA4192AAF918D76B36C3EC',
      '1008BBBAF41F449A87F56F2BA1EE6EF2',
      'DA7C485309814BC2A1B67276D95794F0',
      '93694DF0E1DD4D11A110B0831DD329E3',
      '31B13DA89D374F5689FB0383DB345DAD',
      '5DBEC961B42D48618B09F4E7436CCB78',
      'FFE49AB02B5A4FF681080D53BF8CAEF1',
      '50E52ADE97334B479CEADCB74471AEDD',
      'F40B3859E623438BA2E994776E4CF8BC',
      'F4A443A91C084BAB9FAE2FEEB69AB4A4',
      '9E0594EAD52347FCADE16A84B3EBAE69',
      'F937055E59D5442DA1A8B413D566F3D6',
      'BDC44AD7A7734D06B6DEF202DD9DD16A',
      '68EC6652A4D94E8388C1B1507EA8C54E',
      'A33954135767410DAC6475DC73572DD7',
      '8FFC239F432C4DF09162001989AB5C6C',
      '626841410B5C4E95A38C89C1B064432A',
      '95E24BACD46A407BB954A79ADC00CBD3',
      '5133240D4CC541A6BEC54D9DDD3BD4C9',
      '671A40FDE9EF4F69944536F11CD794FD',
      '76E864EE40FC4213A8925D3D894B6393',
      'FC5C065788E54CA8965CB7054E44D403',
      '53A2900CEDC14644B20D614144A37281',
      '2A22C02377524A65A19B12FF419E5C53',
      'EA962BF98D0849849B5FDB6F84CB0D4A',
      'E3ED8721A0C84E098F4E6BBB8ED67842',
      '1B7C2651C3714258839F6E1119003824',
      'A9D41A0B815F463282246DBA6A661B86',
      'B60B0F1492594A3C8964680BBE950B5E',
      '9D46C71DE5A9450587ADA9545C68BAE3',
      'A327862D94344F048983F44E366F6B21',
      '503919E3F48A43479BD7418529207A76',
      'BAABE3FDBD4445CF9732F57A6B00A79D',
      '47699612D91240EFAB93A03E29D24607',
      '9A364FD63510408D9675B79DAA50A456',
      '8CF02782C2EA4E68A14DA94FB3CA4C33',
      '2845F481D30E479885206C5C5A44D8EB',
      '7431B3FC49134951B573A7A73406B1D8',
      'BD2BE9FB4C034A28A267624DA81FDD74',
      '3BEBC8E51BDD4C75B669019B5B2ED9F8',
      '9D5135DA4F7542F49EEDE0E47234BDA6',
      '482700CA8AC84628A6BA6599EE3F0294',
      'AA417A3E40AC4AEDA50F42156079D886',
      '5243BAE88F6341929353A1584162BC67',
      'B15364F4DCFE497888AF572E5080207F',
      'D3FC3111EFEB4FACB2BD37ED305E3DE8',
      'A9D703C5595E4D4DA51664D0991B04BC',
      '905D67ECDC39446291024704E1E78C32',
      'FC6D3AA449E2485A96F702621F902238',
      'CA5296BBAD5C4E6DA89702BE0BF7AFD7',
      'B40A379479D4438F89CBD85CEA739482',
      '04A6B2F173314614B19A8D23FC8E3288',
      '79D18E15D67946F98C4D48372787B712',
      'C085631C7CBF40B1A55F4D253B11E948',
      '520D88B8F08540ECA4C485475F4290B3',
      '1A1B6958B2514053922C13A248E8BAF7',
      '75B12DF82A164F269A1C003551D1A91D',
      '68D2059E506A417A9DE158561C57ECD1',
      '28B33F0DC55B41D18B98810E1DCAA405',
      '098DFFAB80B24B87AD76244E95D1DBE9',
      '00F9E9799CF74686B09295F0CFB17061',
      'E943F91CA22E473F9FD33E35331805B9',
      'B25C5032746C45D19F0DE5532BEF5817',
      '38180BBB48CF4AD19881587D7A58ED64',
      '3302527219494E53BBD3D834580FE5DD',
      '1022F9AA1C3B47D2A077591609B95C5F',
      'ED259A56617F4BBBBB3302CC2F699792',
      '3A4F1C5354E84D9BB08966DB2FB2A14F',
      'C8AEA311BCDB4DE8BDE29706DDC13274',
      '8836CC7F624A4E199E43516C64D14894',
      'A2714A42E9074E539EE8A907B7B22382',
      'A4846C26964E46F7805144DE2F57E187',
      'CDF219CE236D42E8BF331CD29D497E42',
      '903377A85E744705A239D50794FAAF49',
      '25B128007E4C47C78FBCE5C0E6F46FD1',
      'ACE76BA544C941F1B942C7C49B24D27C',
      '4F96ED7DEA654BBF9C7741FE7712F531',
      'FB28E4273A004B71AD1801B73293DD38',
      '114F715E9DF145008503DDFDC5326974',
      '7867051B2CF44538A3E14D45813F86E4',
      '435C6E32DCB24B46A962D85572E599E8',
      '914C7806BDEE44999B4A6B97FF7C585A',
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
