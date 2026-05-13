
const helpers = require('./helpers');

describe('test/integration/dataCollectorManagement Data Collector Management', () => {
  const numDataCollector = 3;

  const newDataCollector = {
    label : 'Consultations externes',
    description : '2. CONSULTATIONS / 2.1. Consultations externes',
    version_number : '1',
    color : '#ADD8E6',
    is_related_patient : '1',
    include_patient_data : '1',
  };

  const updateAccountReferenceType = {
    label : 'Consultations aux urgences',
    version_number : '1',
    is_related_patient : '0',
    include_patient_data : '0',
  };

  it('POST /data_collector_management add Data Collector Management', () => {
    return agent.post('/data_collector_management')
      .send(newDataCollector)
      .then((res) => {
        helpers.api.created(res);
        newDataCollector.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('GET /data_collector_management/:id returns one Data Collector Management as detail', () => {
    return agent.get(`/data_collector_management/${newDataCollector.id}`)
      .then((res) => {
        expect(res).to.have.status(200);

        expect(res).to.be.a('object');
        expect(res.body).to.have.all.keys('id', 'label', 'description',
          'version_number', 'color', 'is_related_patient', 'include_patient_data');
      })
      .catch(helpers.handler);
  });

  it('PUT /data_collector_management/:id updates the newly added Data Collector Management', () => {
    return agent.put(`/data_collector_management/${newDataCollector.id}`)
      .send(updateAccountReferenceType)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.a('object');
        expect(res.body.id).to.equal(newDataCollector.id);
      })
      .catch(helpers.handler);
  });

  it('GET /data_collector_management returns all Data Collector Management', () => {
    return agent.get(`/data_collector_management/`)
      .then((res) => {
        helpers.api.listed(res, numDataCollector);
        expect(res.body[0]).to.have.all.keys('id', 'label', 'description',
          'version_number', 'color', 'is_related_patient', 'include_patient_data', 'number_submissions');
      })
      .catch(helpers.handler);
  });

  it('DELETE /data_collector_management/:id deletes a Data Collector Management', () => {
    return agent.delete(`/data_collector_management/${newDataCollector.id}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/data_collector_management/${newDataCollector.id}`);
      })
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
