/* eslint no-unused-expressions:off */


const helpers = require('./helpers');

/*
 * The /roles API
 *
 * This test suite implements full CRUD on the /indicators_file API.
 */
describe('test/integration/indicators The indicators file API', () => {
  const { services } = helpers.data;

  const HOSPITALIZATION_TYPE = 1;
  const STAFF_TYPE = 2;
  const FINANCE_TYPE = 3;

  const hospitalizationIndicatorFile = {
    indicator : {
      uuid : 'EDEFEC345E114BA8A75333324EB5A7C5',
      status_id : 1,
      period_id : 201901,
      type_id : HOSPITALIZATION_TYPE,
      service_uuid : services.test,
    },
    hospitalization : {
      uuid : 'B59AE07761764D0E9EA9438E2F6DF52F',
      total_day_realized : 10,
      total_beds : 10,
      total_hospitalized_patient : 10,
      total_external_patient : 10,
      total_death : 1,
    },
  };

  const staffIndicatorFile = {
    indicator : {
      uuid : 'A19AE07761764D0E9EA9438E2F6DF52F',
      status_id : 2,
      period_id : 201902,
      type_id : STAFF_TYPE,
    },
    personel : {
      uuid : 'A29AE07761764D0E9EA9438E2F6DF52F',
      total_doctors : 45,
      total_nurses : 10,
      total_caregivers : 10,
      total_staff : 10,
      total_external_visit : 10,
      total_visit : 10,
      total_surgery_by_doctor : 10,
      total_day_realized : 10,
      total_hospitalized_patient : 10,
    },
  };

  const financeIndicatorFile = {
    indicator : {
      uuid : 'A39AE07761764D0E9EA9438E2F6DF52F',
      status_id : 2,
      period_id : 201902,
      type_id : FINANCE_TYPE,
    },
    finances : {
      uuid : 'A49AE07761764D0E9EA9438E2F6DF52F',
      total_revenue : 40,
      total_subsidies : 45,
      total_drugs_sale : 10,
      total_expenses : 10,
      total_other_charge : 10,
      total_drugs_purchased : 10,
      total_staff_charge : 10,
      total_operating_charge : 10,
      total_depreciation : 10,
      total_debts : 10,
      total_cash : 10,
      total_stock_value : 10,
      total_staff : 10,
    },
  };

  const hospitalizationIndicatorFileUpdate = {
    indicator : {
      status_id : 2,
    },
    hospitalization : {
      total_beds : 10,
      total_hospitalized_patient : 10,
      total_death : 1,
      indicator_uuid : hospitalizationIndicatorFile.indicator.uuid,
    },
  };

  const indicatorFilesKeys = [
    'uuid', 'service_uuid', 'status_id', 'type_id', 'period_id', 'user_id',
    'period_start', 'fiscal_year_id', 'fiscal_year_label', 'status_translate_key',
    'display_name', 'created_date', 'service_name', 'type_text', 'type_translate_key',
  ];

  const hopitalizationKeys = [
    'uuid', 'status_id', 'period_id', 'user_id', 'type_id', 'service_uuid',
    'total_day_realized', 'total_beds', 'total_hospitalized_patient', 'total_death',
    'service_name', 'fiscal_year_id', 'total_external_patient',
  ];

  const staffKeys = [
    'uuid', 'status_id', 'period_id', 'user_id', 'type_id',
    'total_day_realized', 'total_doctors', 'total_nurses', 'total_caregivers',
    'total_staff', 'total_external_visit', 'total_visit', 'total_surgery_by_doctor',
    'total_hospitalized_patient', 'fiscal_year_id',
  ];

  const financeKeys = [
    'uuid', 'status_id', 'period_id', 'user_id', 'type_id',
    'total_revenue', 'total_subsidies', 'total_drugs_sale', 'total_expenses', 'total_other_charge',
    'total_drugs_purchased', 'total_staff_charge', 'total_operating_charge', 'total_depreciation',
    'total_debts', 'total_cash', 'total_stock_value', 'total_staff', 'fiscal_year_id',
  ];

  it('GET /indicators returns a list of indicators files (should be empty)', () => {
    return agent.get('/indicators')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.length(0);
      })
      .catch(helpers.handler);
  });

  it('POST /indicators/hospitalization add a new indicator file', () => {
    return agent.post('/indicators/hospitalization')
      .send(hospitalizationIndicatorFile)
      .then(res => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('POST /indicators/staff add another indicator file', () => {
    return agent.post('/indicators/staff')
      .send(staffIndicatorFile)
      .then(res => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('POST /indicators/finance add another indicator file', () => {
    return agent.post('/indicators/finances')
      .send(financeIndicatorFile)
      .then(res => {
        expect(res).to.have.status(201);
      })
      .catch(helpers.handler);
  });

  it('GET /indicators returns a list of insdicators (3 added indicators files)', () => {
    return agent.get('/indicators')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('array');
        expect(res.body).to.have.length(3);
        expect(res.body[0]).to.have.keys(indicatorFilesKeys);
      })
      .catch(helpers.handler);
  });

  it('GET /indicators/hospitalizations/:uuid returns details of hosp. indicator file)', () => {
    return agent.get(`/indicators/hospitalization/${hospitalizationIndicatorFile.indicator.uuid}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(hopitalizationKeys);

        delete hospitalizationIndicatorFile.hospitalization.uuid;
        Object.keys(hospitalizationIndicatorFile.hospitalization).forEach(key => {
          const value = hospitalizationIndicatorFile.hospitalization[key];
          expect(res.body[key]).to.be.equal(value);
        });
      })
      .catch(helpers.handler);
  });

  it('GET /indicators/staff/:uuid returns details of staff indicator file)', () => {
    return agent.get(`/indicators/staff/${staffIndicatorFile.indicator.uuid}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(staffKeys);

        delete staffIndicatorFile.personel.uuid;
        Object.keys(staffIndicatorFile.personel).forEach(key => {
          const value = staffIndicatorFile.personel[key];
          expect(res.body[key]).to.be.equal(value);
        });
      })
      .catch(helpers.handler);
  });

  it('GET /indicators/finances/:uuid returns details of finances indicator file)', () => {
    return agent.get(`/indicators/finances/${financeIndicatorFile.indicator.uuid}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.keys(financeKeys);

        delete financeIndicatorFile.finances.uuid;
        Object.keys(financeIndicatorFile.finances).forEach(key => {
          const value = financeIndicatorFile.finances[key];
          expect(res.body[key]).to.be.equal(value);
        });
      })
      .catch(helpers.handler);
  });

  it('POST /indicators/hospitalization forbid creation of existing indicator file', () => {
    return agent.post('/indicators/hospitalization')
      .send(hospitalizationIndicatorFile)
      .then(res => {
        expect(res).to.have.status(400);
        expect(res.body.code).to.be.equal('ERRORS.ER_DUP_ENTRY');
      })
      .catch(helpers.handler);
  });

  it('PUT /indicators/hospitalization/:uuid update an existing indicator', () => {
    return agent.put(`/indicators/hospitalization/${hospitalizationIndicatorFile.indicator.uuid}`)
      .send(hospitalizationIndicatorFileUpdate)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('DELETE /indicators/hospitalization/:uuid delete an indicator', () => {
    return agent.delete(`/indicators/hospitalization/${hospitalizationIndicatorFile.indicator.uuid}`)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

});
