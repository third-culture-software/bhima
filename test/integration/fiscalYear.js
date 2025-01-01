/* global expect, agent */

const helpers = require('./helpers');

describe('test/integration/fiscalYear Fiscal Year', () => {

  // Compute the current year and new FY
  const currentYear = new Date().getFullYear();
  const nextFY = currentYear + 1;

  const newFiscalYear = {
    label : `A New Fiscal Year ${nextFY}`,
    start_date : new Date(`${nextFY}-01-01 01:00`),
    end_date : new Date(`${nextFY}-12-31 01:00`),
    number_of_months : 12,
    note : 'Fiscal Year for Integration Test',
    closing_account : 111, // 1311 - Résultat net : Bénéfice *
  };

  const responseKeys = [
    'id', 'enterprise_id', 'number_of_months', 'label', 'start_date',
    'end_date', 'previous_fiscal_year_id', 'locked', 'note',
  ];

  const YEAR_TO_CLOSE = 2;

  it('POST /fiscal adds a fiscal year', () => {
    return agent.post('/fiscal')
      .send(newFiscalYear)
      .then(res => {
        helpers.api.created(res);
        newFiscalYear.id = res.body.id;
        return agent.get(`/fiscal/${newFiscalYear.id}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('POST /fiscal throws errors with invalid data', () => {
    return agent.post('/fiscal')
      .send({ label : 'Broken Year', end_date : new Date() })
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('GET /fiscal returns a list of fiscal_years', () => {
    return agent.get('/fiscal')
      .then(res => {
        // NOTE(@jniles) - the database starts at 2015 for testing FYs.
        helpers.api.listed(res, (nextFY - 2015) + 1);
        const firstYearPeriods = res.body[0].periods;
        expect(firstYearPeriods).to.be.equal(undefined);
      })
      .catch(helpers.handler);
  });

  it('GET /fiscal returns a list of fiscal_years with their periods', () => {
    return agent.get('/fiscal')
      .query({ includePeriods : 1 })
      .then(res => {
        // NOTE(@jniles) - the database starts at 2015 for testing FYs.
        helpers.api.listed(res, (nextFY - 2015) + 1);
        const firstYearPeriods = res.body[0].periods;
        expect(firstYearPeriods).to.have.length(14);
      })
      .catch(helpers.handler);
  });

  it('GET /fiscal/:id returns one fiscal year', () => {
    return agent.get(`/fiscal/${newFiscalYear.id}`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.id).to.be.equal(newFiscalYear.id);
        expect(res.body).to.have.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('PUT /fiscal/:id updates the newly added fiscal year', () => {
    const updateData = {
      label : 'A Fiscal Year Test Update',
      note : 'New note in the test',
    };

    return agent.put(`/fiscal/${newFiscalYear.id}`)
      .send(updateData)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.label).to.equal(updateData.label);
      })
      .catch(helpers.handler);
  });

  it('PUT /fiscal/:id/closing closing a fiscal year', () => {
    const closingAccount = { account_id : newFiscalYear.closing_account };

    return agent.put(`/fiscal/${YEAR_TO_CLOSE}/closing`)
      .send({ params : closingAccount })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body.id).to.equal(YEAR_TO_CLOSE);
      })
      .catch(helpers.handler);
  });

  it('DELETE /fiscal/:id deletes a fiscal year', () => {
    return agent.delete(`/fiscal/${newFiscalYear.id}`)
      .then(res => {
        helpers.api.deleted(res);
        return agent.get(`/fiscal/${newFiscalYear.id}`);
      })
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /enterprises/:id/fiscal_start getting the earliest fiscal year date', () => {
    const mockEnterpriseFiscalEntity = {
      enterpriseId : 1,
      earliestFiscalDate : {
        string : '2015-01-01T00:00:00.000Z',
        year : 2015,
        day : 1,
        month : 0,
      },
    };

    return agent.get(`/enterprises/${mockEnterpriseFiscalEntity.enterpriseId}/fiscal_start`)
      .then((result) => {
        // set up date objects to ensure the correct date is returned
        // matching on the exact MySQL string may differ given different machines
        // or database configurations
        expect(result).to.have.status(200);
        expect(result.body).to.have.all.keys(['start_date']);

        const startDate = new Date(result.body.start_date);

        expect(startDate.getFullYear()).to.equal(mockEnterpriseFiscalEntity.earliestFiscalDate.year);
        expect(startDate.getDate()).to.equal(mockEnterpriseFiscalEntity.earliestFiscalDate.day);
        expect(startDate.getMonth()).to.equal(mockEnterpriseFiscalEntity.earliestFiscalDate.month);
      });

  });
});
