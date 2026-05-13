
const qs = require('qs');
const helpers = require('./helpers');

describe('test/integration/fillForm Fill Form', () => {
  const numDataSurvey = 7;

  const surveyElement1 = {
    medicament : 24,
    poids : 15,
    dosekilos : '1',
    nombreFois : 3,
    voie : 'IV',
    date : '2019-08-21 23:00:00',
    temps : '2019-08-21 19:25:55',
    medConsommes : [24, 23, 26],
    data_collector_management_id : '1',
  };

  const surveyElement2 = {
    surface : '.{longueur} * .{largeur}',
    note_1 : '25',
    structure : 'IMA World Health',
    longueur : 75,
    largeur : 40,
    nombre_agent : 120,
    nombre_femme : 2,
    raison : 'Pas de raison valable',
    data_collector_management_id : 3,
  };

  const surveyUpdate = {
    old : {
      structure : 'IMA World Health',
      longueur : 25,
      largeur : 10,
      surface : '250',
      nombre_agent : 120,
      nombre_femme : 45,
      note_1 : '25',
      raison : '',
    },
    new : {
      structure : 'IMA World Health',
      longueur : 45,
      largeur : 22,
      surface : '250',
      nombre_agent : 120,
      nombre_femme : 45,
      note_1 : '25',
      raison : '',
      data_collector_management_id : 3,
    },
  };

  const params = {
    changes : {
      loggedChanges : [{
        key : 'data_collector_id',
        value : 3,
      }],
      collectorId : 3,
      searchDateFrom : {
        dateSurvey : '2018-12-31',
      },
      searchDateTo : {
        dateSurvey : '2019-12-31',
      },
      multipleChoice : {},
    },
    data_collector_management_id : 3,
  };

  it('POST /fill_form fill survey form 1', () => {
    return agent.post('/fill_form')
      .send(surveyElement1)
      .then((res) => {
        helpers.api.created(res);
        surveyElement1.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('POST /fill_form fill survey form 2', () => {
    return agent.post('/fill_form')
      .send(surveyElement2)
      .then((res) => {
        helpers.api.created(res);
        surveyElement2.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('GET /fill_form/:uuid returns one survey form element detail', () => {
    return agent.get(`/fill_form/${surveyElement2.uuid}`)
      .then((res) => {
        res.body.forEach(item => {
          if (item.survey_form_label === 'surface') {
            expect(parseInt(item.value, 10)).to.equal(75 * 40);

            expect(item).to.have.all.keys('survey_data_item_uuid', 'survey_form_id', 'survey_form_label',
              'survey_data_uuid', 'value');
          }
        });
      })
      .catch(helpers.handler);
  });

  it('PUT /fill_form/:uuid updates the newly added Choice List Management', () => {
    return agent.put(`/fill_form/${surveyElement2.uuid}`)
      .send(surveyUpdate)
      .then((res) => {
        expect(res).to.have.status(201);
        expect(res).to.be.a('object');
        expect(res.body.uuid).to.equal(surveyElement2.uuid);
      })
      .catch(helpers.handler);
  });

  it('GET /fill_form returns all data from survey', () => {
    return agent.get(`/fill_form/${surveyElement2.uuid}`)
      .then((res) => {
        expect(res.body.length).to.equal(numDataSurvey);
      })
      .catch(helpers.handler);
  });

  it('GET /display_metadata returns all data from survey', () => {
    return agent.get(`/display_metadata/`)
      .query(qs.stringify(params))
      .then((res) => {
        expect(res.body).to.have.all.keys('columns', 'surveyData');
      })
      .catch(helpers.handler);
  });

  it('DELETE /display_metadata/:uuid deletes a survey form element', () => {
    return agent.delete(`/display_metadata/${surveyElement2.uuid}`)
      .then((res) => {
        expect(res).to.have.status(204);
      })
      .catch(helpers.handler);
  });
});
