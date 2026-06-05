
 

const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const fixtures = path.resolve(__dirname, '../fixtures');

describe('test/integration/patients/documents Patient Documents (/patients/:uuid/documents) API', () => {

  const patientUuid = '81af634f-321a-40de-bc6f-ceb1167a9f65';
  let docId = null;

  it('POST /patients/:uuid/documents should add documents to a patient', () => {
    return agent
      .post(`/patients/${patientUuid}/documents`)

      // NOTE: the documentation for chai-http is wrong when it comes to multer.
      // You must use fs.createReadStream() to attach files as a multipart type
      // that multer can detect.
      .attach('documents', fs.createReadStream(`${fixtures}/sample.pdf`))
      .then((res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('uuids');
        [docId] = res.body.uuids;
      })
      .catch(helpers.api.handler);
  });

  it('POST /patients/:uuid/documents should add multiple documents to a patient', () => {
    return agent
      .post(`/patients/${patientUuid}/documents`)

      // NOTE: the documentation for chai-http is wrong when it comes to multer.
      // You must use fs.createReadStream() to attach files as a multipart type
      // that multer can detect.
      .attach('documents', fs.createReadStream(`${fixtures}/sample.pdf`), 'first')
      .attach('documents', fs.createReadStream(`${fixtures}/sample.pdf`), 'second')
      .attach('documents', fs.createReadStream(`${fixtures}/sample.pdf`), 'third')
      .then((res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('uuids');
        expect(res.body.uuids).to.have.length(3);
      })
      .catch(helpers.api.handler);
  });

  it('POST /patients/:uuid/documents without a document should throw an error', () => {
    return agent
      .post(`/patients/${patientUuid}/documents`)
      .send({ label : 'record.pdf' })
      .then((res) => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.api.handler);
  });

  it('GET /patients/:uuid/documents should return an array of patient documents', () => {
    return agent.get(`/patients/${patientUuid}/documents`)
      .then((res) => {
        helpers.api.listed(res, 4);
        expect(res.body[0]).to.have.keys(
          'uuid', 'label', 'link', 'timestamp', 'mimetype', 'size', 'user_id', 'display_name'
        );
      })
      .catch(helpers.api.handler);
  });

  it('DELETE /patients/:uuid/documents/:documentUuid should remove that attachment from the patient reference', () => {
    return agent.delete(`/patients/${patientUuid}/documents/${docId}`)
      .then((res) => {
        helpers.api.deleted(res);
      })
      .catch(helpers.api.handler);
  });

  it('DELETE /patients/:uuid/documents/all should remove all documents from the patient', () => {
    return agent.delete(`/patients/${patientUuid}/documents/all`)
      .then((res) => {
        helpers.api.deleted(res);

        // query the database to see if any documents remain
        return agent.get(`/patients/${patientUuid}/documents`);
      })
      .then((res) => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.api.handler);
  });
});
