
 

const helpers = require('../../helpers');

describe('test/integration/reports/finance/cash_receipts', () => {

  describe('Cash Receipts Interface API', () => {

    // known data for requests and assertions
    const validPayment = '2e1332b7-3e63-411e-827d-42ad585ff517';
    const jsonRenderTarget  = '?renderer=json';
    const htmlRenderTarget  = '?renderer=html';
    const pdfRenderTarget   = '?renderer=pdf';
    const invalidRenderTarget = '?renderer=unkownRender';

    it('GET /reports/finance/cash/:uuid should return not found for invalid uuid', () => {
      return agent.get('/reports/finance/cash/unknown')
        .then((result) => {
          helpers.api.errored(result, 404);
        })
        .catch(helpers.handler);
    });

    it('GET /reports/finance/cash/:uuid should return bad request for invalid renderer', () => {
      return agent.get('/reports/finance/cash/'.concat(validPayment, invalidRenderTarget))
        .then((result) => {
          helpers.api.errored(result, 400);
        })
        .catch(helpers.handler);
    });

    it('GET /reports/finance/cash/:uuid should return JSON data for `json` rendering target', () => {
      return agent.get('/reports/finance/cash/'.concat(validPayment, jsonRenderTarget))
        .then(expectReportJSONSuccess)
        .catch(helpers.handler);
    });

    it('GET /reports/finance/cash/:uuid should return HTML data for `html` rendering target', () => {
      return agent.get('/reports/finance/cash/'.concat(validPayment, htmlRenderTarget))
        .then((result) => {
          expect(result.headers['content-type']).to.equal('text/html; charset=utf-8');
          expect(result.text).to.not.be.empty;
        })
        .catch(helpers.handler);
    });

    it('GET /reports/finance/cash/:uuid should return PDF data for `pdf` rendering target', () => {
      return agent.get('/reports/finance/cash/'.concat(validPayment, pdfRenderTarget))
        .then((result) => {
          expect(result.headers['content-type']).to.equal('application/pdf');
          expect(result.type).to.equal('application/pdf');
        })
        .catch(helpers.handler);
    });

    /**
     *
     * @param result
     */
    function expectReportJSONSuccess(result) {
      const keys = ['payment', 'enterprise', 'patient'];
      expect(result).to.have.status(200);
      expect(result.headers['content-type']).to.equal('application/json; charset=utf-8');
      expect(result).to.be.json;
      expect(result.body).to.contain.all.keys(keys);
      return result;
    }

  });

});
