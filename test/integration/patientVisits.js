/* global expect, agent */

const helpers = require('./helpers');

describe('test/integration/patientVisits Patient Visits (/patients/:uuid/visits) API', () => {

  const { services } = helpers.data;
  const patientUuid = '81af634f-321a-40de-bc6f-ceb1167a9f65';
  const pregnantUuid = '274c51ae-efcc-4238-98c6-f402bfb39866';
  const BASE_VISITS = 1;

  const KEYS = [
    'patient_uuid', 'uuid', 'start_date', 'end_date', 'start_notes',
    'end_notes', 'start_diagnosis_id', 'end_diagnosis_id', 'is_open',
    'user_id', 'username', 'start_diagnosis_code', 'start_diagnosis_label',
    'hospitalized', 'last_service_uuid', 'discharge_type_id', 'inside_health_zone',
    'is_pregnant', 'is_refered', 'is_new_case', 'ward_name', 'room_label', 'bed_label',
    'hospital_no', 'service_name', 'sex', 'discharge_label', 'duration', 'display_name',
    'reference',
  ];

  // this will cache the last visit uuid
  let lastVisitUuid;
  let pregnantLastVisitUuid;

  const visitOptions = {
    start_date : new Date(),
    start_notes : 'This was the start',
    start_diagnosis_id : 1234,
    user_id : 1,
    service : { uuid : services.test },
  };

  const pregnantVisitOptions = {
    start_date : new Date(),
    start_notes : 'Pregnant visit',
    start_diagnosis_id : 1234,
    user_id : 1,
    hospitalized : 1,
    is_pregnant : 1,
    is_refered : 1,
    is_new_case : 0,
    inside_health_zone : 1,
    service : { uuid : services.test },
    bed : { room_uuid : 'A6F9527BA7B44A2C9F4FDD7323BBCF72' },
  };

  it('GET /patients/:uuid/visits returns a list of all patient visits', () => {
    return agent.get(`/patients/${patientUuid}/visits`)
      .then((res) => {
        helpers.api.listed(res, BASE_VISITS);
        expect(res.body[0]).to.have.keys(KEYS);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/:uuid/visits?limit={N} limits the results', () => {
    const LIMIT = 1;
    return agent.get(`/patients/${patientUuid}/visits`)
      .query({ limit : LIMIT })
      .then((res) => {
        helpers.api.listed(res, 1);
        expect(res.body[0]).to.have.keys(KEYS);
      })
      .catch(helpers.api.handler);
  });

  it('POST /patients/:uuid/visits/admission starts a new patient visit', () => {
    return agent.post(`/patients/${patientUuid}/visits/admission`)
      .send(visitOptions)
      .then((res) => {
        helpers.api.created(res);

        // cache the uuid
        lastVisitUuid = res.body.uuid;
        visitOptions.uuid = lastVisitUuid;

        return agent.get(`/patients/${patientUuid}/visits/`);
      })
      .then((res) => {
        helpers.api.listed(res, BASE_VISITS + 1);
      })
      .catch(helpers.api.handler);
  });

  it('POST /patients/:uuid/visits/admission starts a second patient visit for a pregnant', () => {
    return agent.post(`/patients/${pregnantUuid}/visits/admission`)
      .send(pregnantVisitOptions)
      .then((res) => {
        helpers.api.created(res);

        // cache the uuid
        pregnantLastVisitUuid = res.body.uuid;
        pregnantVisitOptions.uuid = pregnantLastVisitUuid;

        return agent.get(`/patients/${pregnantUuid}/visits/`);
      })
      .then((res) => {
        helpers.api.listed(res, BASE_VISITS + 1);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/:uuid/visits/:uuid will return a visit by the uuid', () => {
    return agent.get(`/patients/${patientUuid}/visits/${lastVisitUuid}`)
      .then((res) => {
        expect(res).to.have.status(200);

        expect(res.body).to.have.keys(KEYS);

        expect(res.body.uuid).to.equal(lastVisitUuid);
        expect(res.body.start_notes).to.equal(visitOptions.start_notes);
        expect(res.body.is_open).to.equal(1);
        expect(res.body.last_service_uuid).to.equal(visitOptions.service.uuid);

        // default values
        expect(res.body.is_new_case).to.equal(1);
        expect(res.body.is_refered).to.equal(0);
        expect(res.body.is_pregnant).to.equal(0);
        expect(res.body.inside_health_zone).to.equal(null);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/:uuid/visits/:uuid will return the pregnant patient visit by the uuid', () => {
    return agent.get(`/patients/${pregnantUuid}/visits/${pregnantLastVisitUuid}`)
      .then((res) => {
        expect(res).to.have.status(200);

        expect(res.body).to.have.keys(KEYS);

        expect(res.body.uuid).to.equal(pregnantLastVisitUuid);
        expect(res.body.start_notes).to.equal(pregnantVisitOptions.start_notes);
        expect(res.body.is_open).to.equal(1);
        expect(res.body.last_service_uuid).to.equal(pregnantVisitOptions.service.uuid);

        // default values
        expect(res.body.is_new_case).to.equal(0);
        expect(res.body.is_refered).to.equal(1);
        expect(res.body.is_pregnant).to.equal(1);
        expect(res.body.inside_health_zone).to.equal(1);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/:uuid/visits/status will return status of the patient visit', () => {
    return agent.get(`/patients/${pregnantUuid}/visits/status`)
      .then((res) => {
        expect(res).to.have.status(200);

        const expectedKeys = ['is_admitted', 'start_date', 'end_date', 'hospitalized'];
        expect(res.body).to.have.keys(expectedKeys);
        expect(res.body.is_admitted).to.equal(1);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/visits/:uuid will also return a visit by the uuid', () => {
    return agent.get(`/patients/visits/${lastVisitUuid}`)
      .then((res) => {
        expect(res).to.have.status(200);

        expect(res.body).to.have.keys(KEYS);

        expect(res.body.uuid).to.equal(lastVisitUuid);
        expect(res.body.start_notes).to.equal(visitOptions.start_notes);
        expect(res.body.is_open).to.equal(1);
      })
      .catch(helpers.api.handler);
  });

  // synonym for limit = 1, but returns a JSON object instead of an ARRAY
  it('GET /patients/:uuid/visits?limit=1 will return the last patient visit', () => {
    return agent.get(`/patients/${patientUuid}/visits`)
      .query({ limit : 1 })
      .then((res) => {
        expect(res).to.have.status(200);

        const [data] = res.body;

        expect(data).to.have.keys(KEYS);

        expect(data.uuid).to.equal(lastVisitUuid);
        expect(data.start_notes).to.equal(visitOptions.start_notes);
        expect(data.is_open).to.equal(1);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/visits?is_open=1 should find all open patient visits', () => {
    const NUM_MATCHES = 2;
    const qs = { is_open : 1 };
    return agent.get('/patients/visits')
      .query(qs)
      .then((res) => {
        helpers.api.listed(res, NUM_MATCHES);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/visits?is_pregnant=1 should find all pregnant patient visits', () => {
    const NUM_MATCHES = 1;
    const qs = { is_pregnant : 1 };
    return agent.get('/patients/visits')
      .query(qs)
      .then((res) => {
        helpers.api.listed(res, NUM_MATCHES);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/visits?hospitalized=1 should find all hospitalized patient visits', () => {
    const NUM_MATCHES = 1;
    const qs = { hospitalized : 1 };
    return agent.get('/patients/visits')
      .query(qs)
      .then((res) => {
        helpers.api.listed(res, NUM_MATCHES);
      })
      .catch(helpers.api.handler);
  });

  it('POST /patients/:uuid/visits/discharge ends a new patient visit', () => {
    const REGULAR_DISCHARGE = 1;
    const payload = {
      uuid : lastVisitUuid,
      end_date : new Date(),
      end_notes : 'This was the end',
      end_diagnosis_id : 1234,
      discharge_type_id : REGULAR_DISCHARGE,
    };
    return agent.post(`/patients/${patientUuid}/visits/discharge`)
      .send(payload)
      .then((res) => {
        helpers.api.created(res);
        return agent.get(`/patients/${patientUuid}/visits/${lastVisitUuid}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);

        expect(res.body).to.have.keys(KEYS);

        // make sure this values are correct
        expect(res.body.uuid).to.equal(lastVisitUuid);
        expect(res.body.start_notes).to.equal(visitOptions.start_notes);
        expect(res.body.end_notes).to.equal(payload.end_notes);
        expect(res.body.discharge_type_id).to.equal(payload.discharge_type_id);
        expect(res.body.is_open).to.equal(0);
      })
      .catch(helpers.api.handler);
  });

  it('POST /patients/:uuid/visits/discharge ends a pregnant patient visit', () => {
    const DISCHARGE_BUT_ON_BED = 7;
    const payload = {
      uuid : pregnantLastVisitUuid,
      end_date : new Date(),
      end_notes : 'End of the visit of the pregnant patient',
      end_diagnosis_id : 1234,
      discharge_type_id : DISCHARGE_BUT_ON_BED,
    };
    return agent.post(`/patients/${pregnantUuid}/visits/discharge`)
      .send(payload)
      .then((res) => {
        helpers.api.created(res);
        return agent.get(`/patients/${pregnantUuid}/visits/${pregnantLastVisitUuid}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);

        expect(res.body).to.have.keys(KEYS);

        // make sure this values are correct
        expect(res.body.uuid).to.equal(pregnantLastVisitUuid);
        expect(res.body.start_notes).to.equal(pregnantVisitOptions.start_notes);
        expect(res.body.end_notes).to.equal(payload.end_notes);
        expect(res.body.discharge_type_id).to.equal(payload.discharge_type_id);
        expect(res.body.is_open).to.equal(0);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/:uuid/visits/status will return correct status after the discharge of the visit', () => {
    return agent.get(`/patients/${pregnantUuid}/visits/status`)
      .then((res) => {
        expect(res).to.have.status(200);

        const expectedKeys = ['is_admitted', 'start_date', 'end_date', 'hospitalized'];
        expect(res.body).to.have.keys(expectedKeys);
        expect(res.body.is_admitted).to.equal(0);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/visits?diagnosis_id={id} should find all diagnosis with a given ID', () => {
    const NUM_MATCHES = 2;
    const qs = { diagnosis_id : 1234 };
    return agent.get('/patients/visits')
      .query(qs)
      .then((res) => {
        helpers.api.listed(res, NUM_MATCHES);
      })
      .catch(helpers.api.handler);
  });
});
