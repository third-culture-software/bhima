
 

const helpers = require('./helpers');

describe('test/integration/patientInvoiceCreditNotes Credit Notes to reverse invoice transactions', () => {

  const fetchableInvoiceUuid = '957e4e79-a6bb-4b4d-a8f7-c42152b2c2f6';

  it('POST /journal/:uuid/reverse Cancel an Invoice', () => {
    return agent.post(`/journal/${fetchableInvoiceUuid}/reverse`)
      .send({ description : 'Credit Note' })
      .then((res) => {
        helpers.api.created(res);
        return agent.get(`/vouchers/${res.body.uuid}`);
      })
      .then((res) => {
        expect(res).to.be.json;
        expect(res).to.have.status(200);
        expect(res.body.type_id).to.equal(10);
      })
      .catch(helpers.handler);
  });

});
