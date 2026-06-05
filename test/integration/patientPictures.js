

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const fixtures = path.resolve(__dirname, '../fixtures');

describe('test/integration/patientPictures  Patient Pictures (patients/:uuid/pictures) API', () => {
  const patientUuid = '274c51ae-efcc-4238-98c6-f402bfb39866';

  it('POST /patients/:uuid/pictures should set the patient\'s picture', () => {
    return agent.post(`/patients/${patientUuid}/pictures`)
      .attach('pictures', fs.createReadStream(`${fixtures}/patient.png`))
      .then((res) => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.api.handler);
  });
});
