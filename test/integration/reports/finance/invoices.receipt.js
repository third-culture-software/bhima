

const helpers = require('../../helpers');
const RenderingTests = require('../rendering');

const target = '/reports/finance/invoices/';

describe(`test/integration${target} Invoice Receipt`, () => {

  const validInvoice = '957e4e79-a6bb-4b4d-a8f7-c42152b2c2f6';

  const keys = [
    'billing', 'cost', 'date', 'debtor_name', 'debtor_uuid', 'description', 'display_name',
    'items', 'metadata', 'patient_uuid', 'recipient', 'reference', 'subsidy', 'user_id', 'uuid', 'currency_id',
  ];

  // set up the rendering test suite and execute it
  const suite = RenderingTests(target + validInvoice, keys);
  suite();

  // known data for requests and assertions
  const invoiceItemLength = 1;
  const invalidInvoice = 'unknown';

  it(`GET ${target}:uuid should return JSON data for a valid invoice uuid`, () => {
    return agent.get(target.concat(validInvoice))
      .query({ renderer : 'json' })
      .then((result) => {
        expect(result).to.have.status(200);
        expect(result).to.be.json;  
        expect(result.body.items).to.have.length(invoiceItemLength);
      })
      .catch(helpers.handler);
  });

  it(`GET ${target}:uuid should return not found for invalid uuid`, () => {
    return agent.get(target.concat(invalidInvoice))
      .then((result) => {
        helpers.api.errored(result, 404);
      })
      .catch(helpers.handler);
  });
});
