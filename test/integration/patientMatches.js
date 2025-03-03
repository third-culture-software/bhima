/* global expect, agent */

// eslint-disable no-unused-expressions

const UUID = require('uuid').v4;

const helpers = require('./helpers');

const db = require('../../server/lib/db');

function uuid() {
  return UUID().toUpperCase().replace(/-/g, '');
}

// Reuse the same location/project uuids for all mock patients
const groupUuid = '4DE0FE47177F4D30B95FCFF8166400B4';
const locationUuid = '1F162A109F6747889EFFC1FEA42FCC9B';
const projectId = 1;

function addDebtorSQL(debtorUuid, text) {
  return 'INSERT INTO debtor (uuid, group_uuid, text) '
    + `VALUES (0x${debtorUuid}, 0x${groupUuid}, '${text}');`;
}

function addPatientSQL(pinfo) {
  return 'INSERT INTO patient ('
   + 'uuid, project_id, debtor_uuid, display_name, sex, dob, dob_unknown_date, '
   + 'origin_location_id, current_location_id, user_id) '
   + `VALUES (0x${pinfo[0]}, ${projectId}, 0x${pinfo[5]},'${pinfo[1]}', '${pinfo[2]}', `
   + `'${pinfo[3]}', ${pinfo[4]}, 0x${locationUuid}, 0x${locationUuid}, 1`
   + ');';
}

const mockPatients = [
  // uuid, display_name, sex, dob, dob_unknown_date, debtorUuid
  [uuid(), 'John Smith', 'M', '1993-08-01', 'FALSE', uuid()],
  [uuid(), 'Jon Smith', 'M', '1995-06-01', 'TRUE', uuid()],

  [uuid(), 'John Jones Mitchum', 'M', '1980-06-01', 'TRUE', uuid()],
  [uuid(), 'John Janes Mitchum', 'M', '1981-04-21', 'FALSE', uuid()],
  [uuid(), 'John Jenes Matchim', 'M', '1984-06-01', 'TRUE', uuid()],

  [uuid(), 'Lynn H. Black', 'M', '1970-08-01', 'FALSE', uuid()],
  [uuid(), 'Lynn Black', 'F', '1981-06-01', 'TRUE', uuid()],
];

describe('test/integration/patientMatches Find matching patients', () => {

  // prior to tests, create default patients.
  before('add mock patients', () => {
    return mockPatients.reduce((chain, p) => {
      return chain
        .then(() => db.exec(addDebtorSQL(p[5], p[1])))
        .then(() => db.exec(addPatientSQL(p)));
    }, Promise.resolve());
  });

  it(`Temporarily added ${mockPatients.length} mock patients`, () => {
    // Alert the user that mock patients were added
    expect(true).to.be.equals(true);
  });

  // NOW do the tests

  // -------------------------------------------------------------------------------------
  // Various name checks
  it('Get matches for 2-part names like "John Smith"', () => {
    const testName = 'John Smith';
    const conditions = { search_name : testName };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 3);
        // Sort the list, best match first
        const matches = res.body.sort((a, b) => { return (b.matchScore - a.matchScore); });
        expect(matches[0].display_name).to.be.equals(testName);
        expect(matches[0].matchScore).to.be.equals(1);
        expect(matches[1].display_name).to.be.not.equals(testName);
        expect(matches[1].matchScore).to.be.lt(1);
      })
      .catch(helpers.handler);
  });

  it('Get matches for 2-part transposed name "Smith John"', () => {
    const testName = 'John Smith';
    const conditions = { search_name : 'Smith John' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 3);
        // Sort the list, best match first
        const matches = res.body.sort((a, b) => { return (b.matchScore - a.matchScore); });
        expect(matches[0].display_name).to.be.equals(testName);
        expect(matches[0].matchScore).to.be.equals(1);
        expect(matches[1].display_name).to.be.not.equals(testName);
        expect(matches[1].matchScore).to.be.lt(1);
      })
      .catch(helpers.handler);
  });

  it('Get matches for 3-part name "John Jones Mitchum"', () => {
    const testName = 'John Jones Mitchum';
    const conditions = { search_name : 'John Jones Mitchum' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 1);
        expect(res.body[0].display_name).to.be.equals(testName);
        expect(res.body[0].matchScore).to.be.equals(1);
      })
      .catch(helpers.handler);
  });

  it('Get matches for 3-part name "John Jones Mitchum" with 2 names', () => {
    const testName = 'John Jones Mitchum';
    const conditions = { search_name : 'Jon Jones' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 1);
        expect(res.body[0].display_name).to.be.equals(testName);
        expect(res.body[0].matchScore).to.be.lt(1);
      })
      .catch(helpers.handler);
  });

  it('Get matches for 3-part name "John Jones Mitchum" with 1 misspelling', () => {
    const testName = 'John Jones Mitchum';
    const conditions = { search_name : 'John Jones Motchum' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 1);
        expect(res.body[0].display_name).to.be.equals(testName);
        expect(res.body[0].matchScore).to.be.lt(1);
      })
      .catch(helpers.handler);
  });

  it('Get matches for 3-part name "John Jones Mitchum" with 2 misspellings', () => {
    const testName = 'John Jones Mitchum';
    const conditions = { search_name : 'Jahn Jones Motchum' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 1);
        expect(res.body[0].display_name).to.be.equals(testName);
        expect(res.body[0].matchScore).to.be.lt(1);
      })
      .catch(helpers.handler);
  });

  // -------------------------------------------------------------------------------------
  // Make sure the specifying gender helps
  it('Get matches for "Lynn Black"', () => {
    const conditions = { search_name : 'Lynn Black' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });
  it('Get matches for "Lynn Black" with gender', () => {
    const testName = 'Lynn Black';
    const conditions = { search_name : 'Lynn Black', sex : 'F' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 2);
        const matches = res.body.sort((a, b) => { return (b.matchScore - a.matchScore); });
        expect(matches[0].display_name).to.be.equals(testName);
        expect(matches[0].matchScore).to.be.equals(1);
        expect(matches[1].display_name).to.be.not.equals(testName);
        expect(matches[1].matchScore).to.be.lt(1);
      })
      .catch(helpers.handler);
  });

  // -------------------------------------------------------------------------------------
  // Check searches with different numbers of name parts
  it('Get matches for single name "John"', () => {
    const testName = 'John Smith';
    // Note that the best match is 'John Smith' since there is an exact name
    // part match and the difference in number of name parts between the query (1)
    // and the patient (2) is less than for any other exact name part match
    // (eg, for "John Jones Mitchum").  The match for 'Jon Smith' is worse because
    // there is no exact name part match.
    const conditions = { search_name : 'John' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 7);
        const matches = res.body.sort((a, b) => { return (b.matchScore - a.matchScore); });
        expect(matches[0].display_name).to.be.equals(testName); // John Smith
        expect(matches[0].matchScore).to.be.gt(0.95);
        expect(matches[1].display_name).to.be.not.equals(testName); // John Jones Mitchum
        expect(matches[1].matchScore).to.be.lt(matches[0].matchScore);
        expect(matches[matches.length - 1].display_name).to.be.not.equals(testName); // Jon Smith
        expect(matches[matches.length - 1].matchScore).to.be.lt(matches[1].matchScore);
      })
      .catch(helpers.handler);
  });

  // -------------------------------------------------------------------------------------
  // Check DOB searches
  it('Get matches for name "John Jones Mitchum" with DOB / Year', () => {
    const testName = 'John Janes Mitchum';
    // Note that the correct match is the 'Janes' one since it matches both
    // the 2-part name and the year of birth.  The 'Jones' one matches the name,
    // but does not match the year so it gets a lower score.
    const conditions = { search_name : 'John Mitchum', dob : 1981, dob_unknown_date : 'true' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 2);
        const matches = res.body.sort((a, b) => { return (b.matchScore - a.matchScore); });
        expect(matches[0].display_name).to.be.equals(testName);
        expect(matches[0].matchScore).to.be.gt(0.95);
        // Notice discounted score since num parts is different
        expect(matches[1].display_name).to.be.not.equals(testName);
        expect(matches[1].matchScore).to.be.lt(matches[0].matchScore);
        // Notice discounted score by being one year off and different num parts
      })
      .catch(helpers.handler);
  });

  it('Get matches for name "John Jones Mitchum" with DOB with exact date', () => {
    const testName = 'John Janes Mitchum';
    const conditions = { search_name : 'John Mitchum', dob : '1981-04-21', dob_unknown_date : 'false' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 2);
        const matches = res.body.sort((a, b) => { return (b.matchScore - a.matchScore); });
        expect(matches[0].display_name).to.be.equals(testName);
        expect(matches[0].matchScore).to.be.gt(0.95);
        // Notice discounted score since num parts is different
        expect(matches[1].display_name).to.be.not.equals(testName);
        expect(matches[1].matchScore).to.be.lt(matches[0].matchScore);
        // Notice discounted score by being about 15 months off and different number of parts
      })
      .catch(helpers.handler);
  });

  it('Get matches for name "John Jones Mitchum" with DOB approximate date', () => {
    const testName = 'John Janes Mitchum';
    const conditions = { search_name : 'John Mitchum', dob : '1981-02-22', dob_unknown_date : 'false' };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 2);
        const matches = res.body.sort((a, b) => { return (b.matchScore - a.matchScore); });
        expect(matches[0].display_name).to.be.equals(testName);
        expect(matches[0].matchScore).to.be.lt(1);
        expect(matches[1].display_name).to.be.not.equals(testName);
        expect(matches[1].matchScore).to.be.lt(matches[0].matchScore);
      })
      .catch(helpers.handler);
  });

  it('passes when there isn\'t a possible match', () => {
    const testName = 'Ivan Working On The RailRoad';
    const conditions = { search_name : testName };
    return agent.get('/patients')
      .query(conditions)
      .then((res) => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

  // -------------------------------------------------------------------------------------

  // Delete the mock patients
  after('clean up temporary patients', () => {
    return mockPatients.reduce((chain, p) => {
      return chain
        .then(() => db.exec(`DELETE FROM patient WHERE uuid=0x${p[0]};`));
    }, Promise.resolve());
  });

});
