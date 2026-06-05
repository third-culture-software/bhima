
const helpers = require('./helpers');

describe('test/integration/surveyForm Survey Form API', () => {
  const numListElement = 17;

  const formElement = {
    data_collector_management_id : 1,
    type : 8,
    label : 'Image du patient',
    name : 'imagePatient',
    required : 1,
    rank : 8,
  };

  const formElement1 = {
    data_collector_management_id : 1,
    type : 4,
    choice_list_id : 22,
    name : 'medConsommes',
    label : 'Médicaments consommés',
    rank : 8,
  };

  const updateFormElement = {
    data_collector_management_id : 1,
    type : '4',
    name : 'medConsommes',
    label : 'Médicaments consommés',
    hint : 'Pas d\'indice dans cette base de données',
    required : 1,
    constraint : null,
    default : null,
    calculation : null,
    choice_list_id : 22,
    filter_choice_list_id : null,
    other_choice : 0,
    rank : 8,
  };

  it('POST /survey_form add Form Element', () => {
    return agent.post('/survey_form')
      .send(formElement)
      .then((res) => {
        helpers.api.created(res);
        formElement.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('POST /survey_form add Form Element', () => {
    return agent.post('/survey_form')
      .send(formElement1)
      .then((res) => {
        helpers.api.created(res);
        formElement1.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('GET /survey_form/:id returns one survey form element detail', () => {
    return agent.get(`/survey_form/${formElement.id}`)
      .then((res) => {
        expect(res).to.have.status(200);

        expect(res).to.be.a('object');
        expect(res.body).to.have.all.keys('id', 'data_collector_management_id', 'type', 'choice_list_id',
          'filter_choice_list_id', 'other_choice', 'name', 'label', 'hint', 'rank',
          'required', 'constraint', 'default', 'calculation');
      })
      .catch(helpers.handler);
  });

  it('PUT /survey_form/:id updates the newly added Choice List Management', () => {
    return agent.put(`/survey_form/${formElement1.id}`)
      .send(updateFormElement)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.a('object');
        expect(res.body.id).to.equal(formElement1.id);
      })
      .catch(helpers.handler);
  });

  it('GET /survey_form returns all Survey Form Element', () => {
    return agent.get(`/survey_form/`)
      .then((res) => {
        helpers.api.listed(res, numListElement);
        expect(res.body[0]).to.have.all.keys(
          'id', 'is_list', 'label', 'labelType', 'name', 'other_choice', 'required',
          'type', 'typeForm', 'typeLabel', 'version_number', 'calculation', 'choiceListLabel',
          'choice_list_id', 'color', 'constraint', 'data_collector_label', 'data_collector_management_id',
          'default', 'description', 'filterLabel', 'filter_choice_list_id', 'hint', 'rank'
        );
      })
      .catch(helpers.handler);
  });

  it('DELETE /survey_form/:id deletes a survey form element', () => {
    return agent.delete(`/survey_form/${formElement.id}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/survey_form/${formElement.id}`);
      })
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
