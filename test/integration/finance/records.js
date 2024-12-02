/* global expect agent */
/* eslint-disable no-unused-expressions */

const helpers = require('../helpers');

describe('/finance/records ', () => {
  const validVoucherIdentifier = 'VO.TPA.2';
  const validInvoiceIdentifier = 'IV.TPA.5';
  const validCashIdentifier = 'CP.TPA.2';

  const invalidVoucherIdentifier = 'XA.TPC.300';
  const invoiceUuid = '957E4E79A6BB4B4DA8F7C42152B2C2F6';

  it(`/finance/records returns a list of financial records`, () => {
    return agent.get('/finance/records')
      .then(res => {
        helpers.api.listed(res, 23);
      })
      .catch(helpers.handler);
  });

  it(`/finances/records finds a single voucher (${validVoucherIdentifier}) by reference`, () => {
    return agent.get('/finance/records')
      .query({ text : validVoucherIdentifier })
      .then(res => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it(`/finances/records finds a single invoice (${validInvoiceIdentifier}) by reference`, () => {
    return agent.get('/finance/records')
      .query({ text : validInvoiceIdentifier })
      .then(res => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it(`/finances/records finds a single cash payment (${validCashIdentifier}) by reference`, () => {
    return agent.get('/finance/records')
      .query({ text : validCashIdentifier })
      .then(res => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it(`/finances/records returns an empty list for invalid identifiers`, () => {
    return agent.get('/finance/records')
      .query({ text : invalidVoucherIdentifier })
      .then(res => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

  it(`/finances/records finds a single invoice by its UUID`, () => {
    return agent.get('/finance/records/'.concat(invoiceUuid))
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        expect(res.body.uuid).to.equal(invoiceUuid);
      })
      .catch(helpers.handler);
  });

  it('/finances/records respects limit query parameters', () => {
    return agent.get('/finance/records')
      .query({ text : 'IV.T', limit : 2 })
      .then(res => {
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });
});
