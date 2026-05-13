
const RenderingTests = require('../rendering');
const helpers = require('../../helpers');

const target = '/reports/finance/income_expense';

describe.skip(`test/integration${target} Income Expense Report`, () => {
  const keys = [
    'incomes', 'expenses', 'dateFrom', 'dateTo', 'isEmpty', 'isLost', 'overallBalance', 'type_id',
  ];

  const parameters = {
    fiscal : 2,
    periodFrom : 201603,
    periodTo : 201607,
    type : 1,
  };

  describe(`Render Report`, RenderingTests(target, null, parameters));

  it(`GET ${target} returns the correct JSON keys`, () => {
    parameters.renderer = 'json';
    return agent.get(target)
      .query(parameters)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;  
        expect(res.body).to.contain.all.keys(keys);
      })
      .catch(helpers.handler);
  });
});
