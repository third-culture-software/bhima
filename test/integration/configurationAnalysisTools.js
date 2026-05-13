
const helpers = require('./helpers');

describe('test/integration/configurationAnalysisTools Configuration Analysis Tools', () => {
  const numConfiguration = 5;

  const newConfiguration = {
    label : 'Subvention d\'exploitation',
    account_reference_id : 12,
    analysis_tool_type_id : 3,
  };

  const updateConfiguration = {
    id : 5,
    label : 'Subvention Updatede d\'exploitation',
    account_reference_id : 11,
    analysis_tool_type_id : 2,
  };

  it('POST /configuration_analysis_tools add new Configuration', () => {
    return agent.post('/configuration_analysis_tools')
      .send(newConfiguration)
      .then((res) => {
        helpers.api.created(res);
        newConfiguration.id = res.body.id;
      })
      .catch(helpers.handler);
  });

  it('GET /configuration_analysis_tools all Analysis Configuration', () => {
    return agent.get(`/configuration_analysis_tools/`)
      .then((res) => {
        helpers.api.listed(res, numConfiguration);
        expect(res.body[0]).to.have.all.keys(
          'id', 'label', 'abbr', 'account_reference_id',
          'analysis_tool_type_id', 'typeLabel',
        );
      })
      .catch(helpers.handler);
  });

  it('GET /configuration_analysis_tools/:id returns one Configuration as detail', () => {
    return agent.get(`/configuration_analysis_tools/${newConfiguration.id}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.a('object');
        expect(res.body).to.have.all.keys(
          'id', 'label', 'account_reference_id', 'analysis_tool_type_id',
        );
      })
      .catch(helpers.handler);
  });

  it('PUT /configuration_analysis_tools/:id updates the newly added Configuration', () => {
    return agent.put(`/configuration_analysis_tools/${newConfiguration.id}`)
      .send(updateConfiguration)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.a('object');
        expect(res.body.id).to.equal(newConfiguration.id);
      })
      .catch(helpers.handler);
  });

  it('DELETE /configuration_analysis_tools/:id deletes a Analysis Configuration element', () => {
    return agent.delete(`/configuration_analysis_tools/${newConfiguration.id}`)
      .then((res) => {
        helpers.api.deleted(res);
        return agent.get(`/configuration_analysis_tools/${newConfiguration.id}`);
      })
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
