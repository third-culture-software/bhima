

const helpers = require('../helpers');

describe('test/integration/budget/budget Basic Budget Operations API', () => {

  const accountTotal = 100000;
  const accountNum = 70611012; // Hospitalisation (income)
  const period1Budget = 20000;
  const newPeriod1Budget = 17000;
  let accountId;
  let fiscalYearId;
  let periods;
  let budgetId1;

  it('Get the latest fiscal year', () => {
    return agent.get('/fiscal')
      .then(res => {
        // The /fiscal query sorts by start date (DESC) by default,
        // so the first entry is always that last defined fiscal year
        const [year] = JSON.parse(res.text);
        fiscalYearId = year.id;
        expect(Number.isInteger(fiscalYearId));
      });
  });

  it('Get test account ID', () => {
    return agent.get('/accounts')
      .query({ number : accountNum })
      .then(res => {
        expect(res).to.have.status(200);
        accountId = res.body[0].id;
        expect(Number.isInteger(accountId));
      });
  });

  it('Delete the budget data for this fiscal year', () => {
    return agent.delete(`/budget/${fiscalYearId}`)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('Verify deletion of budget items for the fiscal year', () => {
    return agent.get('/budget')
      .query({ fiscal_year_id : fiscalYearId })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(0);
      })
      .catch(helpers.handler);
  });

  it('Add some budget data', () => {
    // First, get the period IDs for this fiscal year
    return agent.get('/periods')
      .query({ fiscal_year_id : fiscalYearId })
      .then(res1 => {
        expect(res1).to.have.status(200);
        periods = res1.body;
        expect(periods[0].number, 'The first period has number zero').to.be.equal(0);

        // Add the total for the year (in period 0)
        return agent.post('/budget')
          .query({
            acctNumber : accountNum,
            periodId : periods[0].id,
            budget : accountTotal,
            locked : 1,
          });
      })
      .then(res2 => {
        expect(res2).to.have.status(200);

        // Now add some data for this budget item for period 1
        return agent.post('/budget')
          .query({
            acctNumber : accountNum,
            periodId : periods[1].id,
            budget : period1Budget,
            locked : 0,
          });
      })
      .then(res3 => {
        expect(res3).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('Verify the just-added test budget data', () => {
    return agent.get('/budget')
      .query({ fiscal_year_id : fiscalYearId })
      .then(res => {
        expect(res).to.have.status(200);

        // Verify that we have loaded all the data
        expect(res.body).to.have.length(2);
        const data = res.body;
        budgetId1 = data[1].budgetId;

        // Check period 0
        expect(data[0].acctNum).to.be.equal(accountNum);
        expect(data[0].periodNum).to.be.equal(0);
        expect(data[0].budget).to.be.equal(accountTotal);
        expect(data[0].locked).to.be.equal(1);

        // Check period 1
        expect(data[1].acctNum).to.be.equal(accountNum);
        expect(data[1].periodNum).to.be.equal(1);
        expect(data[1].budget).to.be.equal(period1Budget);
        expect(data[1].locked).to.be.equal(0);
      })
      .catch(helpers.handler);
  });

  it('Try to update the budget data for period 1', () => {
    // First, change only the budget
    return agent.put(`/budget/update/${budgetId1}`)
      .query({ budget : newPeriod1Budget })
      .then(res => {
        expect(res).to.have.status(200);
        return agent.get('/budget').query({ fiscal_year_id : fiscalYearId });
      })
      .then(res2 => {
        // Verify that we have only changed the budget
        expect(res2).to.have.status(200);
        const data = res2.body;

        expect(data[0].acctNum).to.be.equal(accountNum);
        expect(data[0].periodNum).to.be.equal(0);
        expect(data[0].budget).to.be.equal(accountTotal);
        expect(data[0].locked).to.be.equal(1);

        expect(data[1].acctNum).to.be.equal(accountNum);
        expect(data[1].periodNum).to.be.equal(1);
        expect(data[1].budget).to.be.equal(newPeriod1Budget);
        expect(data[1].locked).to.be.equal(0);
      })
      .catch(helpers.handler);
  });

  it('Try to update the budget lock for period 1', () => {
    // First, change only the budget
    return agent.put(`/budget/update/${budgetId1}`)
      .query({ locked : 1 })
      .then(res => {
        expect(res).to.have.status(200);
        return agent.get('/budget').query({ fiscal_year_id : fiscalYearId });
      })
      .then(res2 => {
        // Verify that we have only changed the budget
        expect(res2).to.have.status(200);
        const data = res2.body;

        expect(data[0].acctNum).to.be.equal(accountNum);
        expect(data[0].periodNum).to.be.equal(0);
        expect(data[0].budget).to.be.equal(accountTotal);
        expect(data[0].locked).to.be.equal(1);

        expect(data[1].acctNum).to.be.equal(accountNum);
        expect(data[1].periodNum).to.be.equal(1);
        expect(data[1].budget).to.be.equal(newPeriod1Budget);
        expect(data[1].locked).to.be.equal(1);
      })
      .catch(helpers.handler);
  });

  it('Try to update the budget amount and lock for period 1', () => {
    // First, change only the budget
    return agent.put(`/budget/update/${budgetId1}`)
      .query({ budget : period1Budget, locked : 0 })
      .then(res => {
        expect(res).to.have.status(200);
        return agent.get('/budget').query({ fiscal_year_id : fiscalYearId });
      })
      .then(res2 => {
        // Verify that we have only changed the budget
        expect(res2).to.have.status(200);
        const data = res2.body;

        expect(data[0].acctNum).to.be.equal(accountNum);
        expect(data[0].periodNum).to.be.equal(0);
        expect(data[0].budget).to.be.equal(accountTotal);
        expect(data[0].locked).to.be.equal(1);

        expect(data[1].acctNum).to.be.equal(accountNum);
        expect(data[1].periodNum).to.be.equal(1);
        expect(data[1].budget).to.be.equal(period1Budget);
        expect(data[1].locked).to.be.equal(0);
      })
      .catch(helpers.handler);
  });

  // it('ABORT', () => {
  //   expect(true).to.be.equal(false);
  // });

});
