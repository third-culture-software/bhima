/* global expect, agent */

const fs = require('fs');
const helpers = require('../helpers');

describe('test/integration/budget/import The budget import API', () => {
  const file = './test/fixtures/budget-to-import.csv';
  const filename = 'budget-to-import.csv';

  const invalidHeadersFile = './test/fixtures/budget-to-import-bad-headers.csv';
  const invalidAcctFile = './test/fixtures/budget-to-import-bad-line-account.csv';
  const invalidAcctTypeFile = './test/fixtures/budget-to-import-bad-line-account-type.csv';
  const invalidAcctTypeIncorrectFile = './test/fixtures/budget-to-import-bad-line-account-type-incorrect.csv';
  const invalidBudgetFile = './test/fixtures/budget-to-import-bad-line-budget.csv';
  const invalidNegativeBudgetFile = './test/fixtures/budget-to-import-bad-line-negative-budget.csv';

  let fiscalYearId;

  /**
   * Get the last defined fiscal year
   */
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

  /**
   * test the /budget/import API for downloading
   * the budget template file
   */
  it('GET /budget/download_template_file downloads the budget template file', () => {
    const templateCsvHeaders = 'AcctNum, Label, Type, Budget, BudgetLastYear';
    return agent.get('/budget/download_template_file')
      .then(res => {
        expect(res).to.have.status(200);
        const header = res.text.split('\n', 1)[0];
        expect(String(header).trim()).to.be.equal(templateCsvHeaders);
      })
      .catch(helpers.handler);
  });

  /**
   * Just in case, delete any old budget data
   */
  it('Delete any old budget data for this fiscal year', () => {
    return agent.delete(`/budget/${fiscalYearId}`)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  /**
   * Verify that there is no budget data loaded
   */
  it('GET /budget gets no budget data for the specified fiscal year', () => {
    return agent.get('/budget')
      .query({ fiscal_year_id : fiscalYearId })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.length(0);
      })
      .catch(helpers.handler);
  });

  /**
   * test the /budget/import API for importing a budget from a csv file
   */
  it(`POST /budget/import upload and import a sample budget template file`, () => {
    return agent.post(`/budget/import/${fiscalYearId}`)
      .attach('file', fs.createReadStream(file), filename)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  /**
   * Verify that there is now budget data
   */
  it('GET /budget gets budget all the FY data that was just loaded', () => {
    return agent.get('/budget')
      .query({ fiscal_year_id : fiscalYearId })
      .then(res => {
        expect(res).to.have.status(200);

        // Verify the right number of entries were created
        expect(res.body).to.have.length(22);

        // Do a spot-check
        const testLine = res.body[1];
        expect(testLine.acctNum).to.be.equal(60111011);
        expect(testLine.acctLabel).to.be.equal('Achat Médicaments en Sirop');
        expect(testLine.acctType).to.be.equal('expense');
        expect(testLine.budget).to.be.equal(20000);
      })
      .catch(helpers.handler);
  });

  /**
   * Create the rest of the budget entries
   */
  it('POST /budget/populate/:fiscal_year creates the remaining budget items for the FY', () => {
    return agent.post(`/budget/populate/${fiscalYearId}`)
      .then(res1 => {
        expect(res1).to.have.status(200);

        // Load the budget data to make sure all periods were added
        return agent.get('/budget')
          .query({ fiscal_year_id : fiscalYearId });
      })
      .then(res2 => {
        expect(res2).to.have.status(200);

        // Verify that we have added all the necessary periods
        expect(res2.body).to.have.length(22 * 13);
      })
      .catch(helpers.handler);
  });

  /**
   * Fill in the budget data for the fiscal year
   */
  it('PUT /budget/fill/:fiscal_year fills the budget data for the year FY', () => {
    return agent.put(`/budget/fill/${fiscalYearId}`)
      .then(res1 => {
        expect(res1).to.have.status(200);

        // Load the budget data to make sure all periods were added
        return agent.get('/budget')
          .query({ fiscal_year_id : fiscalYearId });
      })
      .then(res2 => {
        expect(res2).to.have.status(200);
        const data = res2.body;

        // Verify that all accounts add up properly (to the integer)
        const accounts = Array.from(data.reduce((accts, item) => accts.add(item.id), new Set())).sort();
        accounts.forEach(acct => {
          // Get the total budgeted for this account for the year
          const basePeriod = data.find(item => (item.id === acct) && (item.periodNum === 0));
          const total = Math.round(basePeriod.budget);

          // Now sum up the total budget of the periods
          const budgeted = Math.round(data.reduce(
            (sum, item) => sum + ((item.id === acct && item.periodNum > 0) ? item.budget : 0), 0));

          expect(budgeted,
            `FY Budget of ${total} for account ${acct} did not match the totals for budget periods ${budgeted}`)
            .to.equal(total);
        });
      })
      .catch(helpers.handler);
  });

  // it('ABORT', () => {
  //   expect(true).to.be.equal(false);
  // });

  /**
   * test uploads of a bad csv files
   */
  it('POST /budget/import blocks an upload of a bad csv file for budget import (bad header)', () => {
    return agent.post(`/budget/import/${fiscalYearId}`)
      .attach('file', fs.createReadStream(invalidHeadersFile))
      .then(res => {
        expect(res).to.have.status(400);
      })
      .catch(helpers.handler);
  });

  it('POST /budget/import blocks an upload of a bad csv file for budget import (bad account number)', () => {
    return agent.post(`/budget/import/${fiscalYearId}`)
      .attach('file', fs.createReadStream(invalidAcctFile))
      .then(res => {
        expect(res).to.have.status(400);
      })
      .catch(helpers.handler);
  });

  it('POST /budget/import blocks an upload of a bad csv file for budget import (bad budget number)', () => {
    return agent.post(`/budget/import/${fiscalYearId}`)
      .attach('file', fs.createReadStream(invalidBudgetFile))
      .then(res => {
        expect(res).to.have.status(400);
      })
      .catch(helpers.handler);
  });

  it('POST /budget/import blocks an upload of a bad csv file for budget import (negative budget number)', () => {
    return agent.post(`/budget/import/${fiscalYearId}`)
      .attach('file', fs.createReadStream(invalidNegativeBudgetFile))
      .then(res => {
        expect(res).to.have.status(400);
      })
      .catch(helpers.handler);
  });

  it('POST /budget/import blocks an upload of a bad csv file for budget import (invalid account type)', () => {
    return agent.post(`/budget/import/${fiscalYearId}`)
      .attach('file', fs.createReadStream(invalidAcctTypeFile))
      .then(res => {
        expect(res).to.have.status(400);
      })
      .catch(helpers.handler);
  });

  it('POST /budget/import blocks an upload of a bad csv file for budget import (incorrect account type)', () => {
    return agent.post(`/budget/import/${fiscalYearId}`)
      .attach('file', fs.createReadStream(invalidAcctTypeIncorrectFile))
      .then(res => {
        expect(res).to.have.status(400);
      })
      .catch(helpers.handler);
  });

});
