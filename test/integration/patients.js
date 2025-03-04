/* global expect, agent */

const helpers = require('./helpers');

const INITIAL_TEST_PATIENTS = 262;

// TODO Should this import UUID library and track mock patient throughout?
const mockPatientUuid = '85BF7A8516D94AE5B5C01FEC9748D2F9';
const mockDebtorUuid = 'EC4241E43558493B9D78DBAA47E3CEFD';
const missingPatientUuid = 'D74BC1673E14487EAF7822FD725E4AC1';
const mockPatientDoublonUuid = 'WWBF7A8516D94AE5B5C01FEC9748D2F9';
const mockDebtorDoublonUuid = 'WW4241E43558493B9D78DBAA47E3CEFD';

const mockDebtor = {
  uuid : mockDebtorUuid,
  debtor_group_uuid : '4DE0FE47177F4D30B95FCFF8166400B4',
};

const mockPatient = {
  display_name : 'Mock Patient First',
  dob : new Date('1993-06-01'),
  current_location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
  origin_location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
  sex : 'M',
  project_id : 1,
  hospital_no : 120,
  uuid : mockPatientUuid,
};

// missing last name, sex
const missingParamsPatient = {
  display_name : 'Mock Patient',
  dob : new Date('1993-06-01'),
  current_location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
  origin_location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
  project_id : 1,
  hospital_no : 121,
  uuid : missingPatientUuid,
};

const patientTest2 = '274C51AEEFCC423898C6F402BFB39866';

const mockRequest = {
  finance : mockDebtor,
  medical : mockPatient,
};

const mockMissingRequest = {
  finance : {
    debtor_group_uuid : '4DE0FE47177F4D30B95FCFF8166400B4',
  },
  medical : missingParamsPatient,
};

const badRequest = {
  incorrectLayout : mockDebtor,
  incorrectTest : mockPatient,
};

const mockDebtorDoublon = {
  uuid : mockDebtorDoublonUuid,
  debtor_group_uuid : '4DE0FE47177F4D30B95FCFF8166400B4',
};

const mockPatientDoublon = {
  display_name : 'Mock Patient First Doublon',
  dob : new Date('2017-08-24'),
  current_location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
  origin_location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
  sex : 'M',
  project_id : 1,
  hospital_no : 220,
  uuid : mockPatientDoublonUuid,
};

const mockDoublonRequest = {
  finance : mockDebtorDoublon,
  medical : mockPatientDoublon,
};

describe('test/integration/patients Patients API', () => {
  // API Test for /patients/  routes
  describe('Patient Search', () => {

    it('GET /patients with missing necessary parameters should succeed', () => {
      return agent.get('/patients/?')
        .then(res => {
          helpers.api.listed(res, INITIAL_TEST_PATIENTS + 1);
        })
        .catch(helpers.handler);
    });

    it('GET /patients with \'reference\' parameter', () => {
      const conditions = { reference : 'PA.TPA.1' };
      return agent.get('/patients')
        .query(conditions)
        .then((res) => {
          helpers.api.listed(res, 1);
        })
        .catch(helpers.handler);
    });

    it('GET /patients with \'display_name\' parameter', () => {
      const conditions = { display_name : 'Test' };
      return agent.get('/patients/')
        .query(conditions)
        .then((res) => {
          helpers.api.listed(res, 3);
        })
        .catch(helpers.handler);
    });

    it('GET /patients/search/name with display_name parameter should return a subset of patient information', () => {
      const conditions = { display_name : 'Test' };
      return agent.get('/patients/search/name')
        .query(conditions)
        .then((res) => {
          helpers.api.listed(res, 3);

          const firstRecord = res.body[0];
          expect(firstRecord).to.have.all.keys(['uuid', 'display_name', 'reference', 'color']);
        })
        .catch(helpers.handler);
    });

    it('GET /patients/search/name results in bad request with no name provided', () => {
      const conditions = {};
      return agent.get('/patients/search/name')
        .query(conditions)
        .then((res) => {
          helpers.api.errored(res, 400);
        })
        .catch(helpers.handler);
    });

    it('GET /patients should be composable', () => {
      const conditions = { sex : 'M', display_name : 2 };
      return agent.get('/patients')
        .query(conditions)
        .then((res) => {
          helpers.api.listed(res, 1);
        })
        .catch(helpers.handler);
    });

    it('GET /patients with `name` and `reference` parameters for the priority of reference', () => {
      const conditions = { display_name : 'Test', reference : 'PA.TPA.1' };
      return agent.get('/patients')
        .query(conditions)
        .then((res) => {
          helpers.api.listed(res, 1);
          // eslint-disable-next-line no-unused-expressions
          expect(res.body[0].reference).to.exist;
          expect(res.body[0].reference).to.be.equals(conditions.reference);
        })
        .catch(helpers.handler);
    });

    it('GET /patients with debtor_uuid retrieves the patients with that debtor_uuid', () => {
      const conditions = { debtor_uuid : '3BE232F9A4B94AF6984C5D3F87D5C107' };
      return agent.get('/patients')
        .query(conditions)
        .then((res) => {
          helpers.api.listed(res, 1);
        })
        .catch(helpers.handler);
    });

    it('GET /patients with detailed and limit parameters', () => {
      const conditions = { detailed : 1, limit : 5, display_name : 'Test' };
      return agent.get('/patients')
        .query(conditions)
        .then((res) => {
          const expected = [
            'father_name', 'mother_name', 'profession', 'employer', 'spouse', 'spouse_employer',
            'spouse_profession', 'religion', 'marital_status', 'phone', 'email', 'address_1',
            'address_2', 'origin_location_id', 'current_location_id', 'registration_date',
            'title', 'notes', 'hospital_no', 'abbr', 'text', 'account_id', 'price_list_uuid',
            'is_convention', 'locked',
          ];

          helpers.api.listed(res, 3);

          expect(res.body[0]).to.contain.all.keys(expected);
          return agent.get('/patients/?display_name=Test&limit=1');
        })
        .then((res) => {
          helpers.api.listed(res, 1);
        })
        .catch(helpers.handler);
    });
  });

  it('GET /patients/merge/duplicates returns duplicate patients', () => {
    return agent.get('/patients/merge/duplicates')
      .then((res) => {
        helpers.api.listed(res, 0);
        return agent.get('/patients/merge/duplicates')
          .query({ sensitivity : 0 });
      })
      .then((res) => {
        helpers.api.listed(res, 25);
      })
      .catch(helpers.handler);
  });

  it('GET /patients returns a list of patients', () => {
    return agent.get('/patients')
      .then((res) => {
        helpers.api.listed(res, INITIAL_TEST_PATIENTS);
      })
      .catch(helpers.handler);
  });

  it('POST /patients will register a valid patient', () => {
    return agent.post('/patients')
      .send(mockRequest)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  it('GET /patients/:uuid finds and retrieves the details of the registered patient', () => {
    return agent.get(`/patients/${mockPatientUuid}`)
      .then((res) => {
        const expectedKeys = ['uuid', 'display_name', 'sex', 'origin_location_id'];

        expect(res).to.have.status(200);
        const retrievedDetails = res.body;

        // eslint-disable-next-line no-unused-expressions
        expect(retrievedDetails).to.not.be.empty;
        expect(retrievedDetails).to.contain.keys(expectedKeys);

        expectedKeys.forEach((key) => {
          expect(retrievedDetails[key]).to.equal(mockPatient[key]);
        });
      });
  });

  it('GET /patients/:uuid will return not found for invalid id', () => {
    return agent.get('/patients/unknownid')
      .then((res) => {
        helpers.api.errored(res, 404);
      });
  });

  it('POST /patients will reject a patient with missing information', () => {
    return agent.post('/patients')
      .send(mockMissingRequest)
      .then((res) => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('POST /patients will reject a patient with an incorrectly formatted request object', () => {
    return agent.post('/patients')
      .send(badRequest)
      .then((res) => {
        helpers.api.errored(res, 400);
        expect(res.body.code).to.be.equal('ERRORS.BAD_REQUEST');
      })
      .catch(helpers.handler);
  });

  it(`PUT /patients/${mockPatientUuid} will update a patient's date of birth`, () => {
    const date = new Date('06-06-1992');
    return agent.put(`/patients/${mockPatientUuid}`)
      .send({ dob : date })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('uuid');
        expect(res.body.dob).to.equal(date.toISOString());
      })
      .catch(helpers.handler);
  });

  it('GET patients/:uuid/stock/movements Returns the stock movement related to the Patient', () => {
    return agent.get(`/patients/${patientTest2}/stock/movements`)
      .then((res) => {
        const expectedKeys = [
          'document_uuid', 'depot_uuid', 'date', 'invoiceReference',
          'value', 'depot_name', 'hrReference',
        ];
        expect(res.body[0]).to.contain.keys(expectedKeys);
        expect(res.body[0].hrReference).to.equal('SM.9.7');
      });

  });

  // merge patients
  describe('Merge Patients', MergePatients);

  // hospital number uniqueness tests
  describe('Hospital Number uniqueness', HospitalNumber);

  // patient group tests
  describe('Patient Groups', PatientGroups);

  describe('Patient Billing Service', billingServices);

  describe('Patient Subsidies', subsidies);
});

// patients merge
function MergePatients() {
  // add a doublon
  it('POST /patients will register a valid doublon patient', () => {
    return agent.post('/patients')
      .send(mockDoublonRequest)
      .then((res) => {
        helpers.api.created(res);
      })
      .catch(helpers.handler);
  });

  const params = {
    selected : mockPatientUuid,
    other : [mockPatientDoublonUuid],
  };

  it('POST /patients/merge will merge two patients into one', () => {
    return agent.post('/patients/merge')
      .send(params)
      .then((res) => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });

  it('GET /patients returns a correct reduced list of patients', () => {
    return agent.get('/patients')
      .then((res) => {
        // Initial test patient : 5, plus one added in this test suit
        // we also add another new one with `mockDoublonRequest`
        // the total is 7, after the merge we must remain with just 6
        helpers.api.listed(res, 263);
      })
      .catch(helpers.handler);
  });
}

// Tests for /patients/:uuid/groups
function PatientGroups() {

  // shared constants
  const patientUuid = '81af634f-321a-40de-bc6f-ceb1167a9f65';
  const subscribedPatientGroups = 1;

  it('GET /patients/:uuid/groups will return a list of the patients groups', () => {
    return agent.get(`/patients/${patientUuid}/groups`)
      .then((res) => {
        helpers.api.listed(res, subscribedPatientGroups);
      })
      .catch(helpers.handler);
  });

  it('GET /patients/:uuid/groups will return 404 not found for invalid request', () => {
    return agent.get('/patients/unknownid/groups')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('POST /patients/:uuid/groups will update a patient\'s groups', () => {
    const assignments = ['112a9fb5-847d-4c6a-9b20-710fa8b4da24'];

    return agent.post(`/patients/${patientUuid}/groups`)
      .send({ assignments })
      .then(res => {
        expect(res).to.have.status(200);
        // eslint-disable-next-line no-unused-expressions
        expect(res.body).to.not.be.empty;
        expect(res.body[0].affectedRows).to.equal(assignments.length);
      })
      .catch(helpers.handler);
  });
}

// Tests for /patients/hospital_number/:id/exists
function HospitalNumber() {
  const existingNumber = 100;
  const absentNumber = 3.3;

  it('GET /patients/hospital_number/:id/exists returns true for a used number', () => {
    return agent.get(`/patients/hospital_number/${existingNumber}/exists`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.equal('true');
      })
      .catch(helpers.handler);
  });

  it('GET /patients/hospital_number/:id/exists false for a new number', () => {
    return agent.get(`/patients/hospital_number/${absentNumber}/exists`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.equal('false');
      })
      .catch(helpers.handler);
  });
}

function billingServices() {
  const patientUuid = '85bf7a85-16d9-4ae5-b5c0-1fec9748d2f9';
  const billingServiceAttached = 2;

  it('GET /patients/:uuid/services will return a list of the patients billing services', () => {
    return agent.get(`/patients/${patientUuid}/services`)
      .then((res) => {
        helpers.api.listed(res, billingServiceAttached);
      })
      .catch(helpers.handler);
  });
}

function subsidies() {
  const patientUuid = '85bf7a85-16d9-4ae5-b5c0-1fec9748d2f9';
  const subsidiesAttached = 1;

  it('GET /patients/:uuid/subsidies will return a list of the patients subsidies', () => {
    return agent.get(`/patients/${patientUuid}/subsidies`)
      .then((res) => {
        helpers.api.listed(res, subsidiesAttached);
      })
      .catch(helpers.handler);
  });
}
