/**
 * @file CautionPayments
 * @description
 * This contains the test cases for creating cautions via the /cash API.
 */
module.exports = CautionPayments;

const helpers = require('./helpers');

/**
 *
 */
function CautionPayments() {
  const CAUTION_PAYMENT = {
    amount :      15000,
    currency_id : 1,
    cashbox_id :  1,
    debtor_uuid : '3be232f9-a4b9-4af6-984c-5d3f87d5c107',
    project_id :  1,
    date :        new Date(),
    user_id :     1,
    is_caution :  1,
    description : 'A caution payment via /cash API',
  };

  // create a caution payment
  it('POST /cash should create a caution payment', () => {
    return agent.post('/cash')
      .send({ payment : CAUTION_PAYMENT })
      .then((res) => {

        // checks to see if the response correspond to the correct response codes
        helpers.api.created(res);

        // store the payment id for later
        CAUTION_PAYMENT.uuid = res.body.uuid;

        // make sure the payment is retrievable
        return agent.get(`/cash/${CAUTION_PAYMENT.uuid}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;

        expect(res.body.uuid).to.equal(CAUTION_PAYMENT.uuid);
        expect(res.body.currency_id).to.equal(CAUTION_PAYMENT.currency_id);
        expect(res.body.cashbox_id).to.equal(CAUTION_PAYMENT.cashbox_id);
        expect(res.body.is_caution).to.equal(CAUTION_PAYMENT.is_caution);
      })
      .catch(helpers.handler);
  });
}
