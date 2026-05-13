
 

const helpers = require('./helpers');

describe('test/integration/groups Group subscriptions API', () => {

  const invalidKey = 'notakey';
  const validKey = 'debtor_group_invoicing_fee';

  // debtor group id
  const validEntity = '4de0fe47-177f-4d30-b95f-cff8166400b4';

  // billing service ids
  const validSubscriptions = {
    1 : true,
    2 : true,
  };

  it('POST /groups/:key/:id rejects an invalid key', () => {
    return agent.post(`/groups/${invalidKey}/id`)
      .send(validSubscriptions)
      .then((result) => {
        helpers.api.errored(result, 400, 'ERROR.INVALID_REQUEST');
      })
      .catch(helpers.handler);
  });

  it('POST /groups/:key/:id rejects a requst with valid key and no subscriptions', () => {
    return agent.post(`/groups/${validKey}/${validEntity}`)
      .send({})
      .then((result) => {
        helpers.api.errored(result, 400, 'ERROR.ERR_MISSING_INFO');
      })
      .catch(helpers.handler);
  });

  it('POST /groups/:key/:id updates group subscriptions with valid request', () => {
    // determine how many subscriptions should be affected
    const trueSubscriptions = [];
    Object.keys(validSubscriptions).forEach((key) => {
      if (validSubscriptions[key]) { trueSubscriptions.push(key); }
    });

    return agent.post(`/groups/${validKey}/${validEntity}`)
      .send({ subscriptions : validSubscriptions })
      .then((result) => {
        expect(result).to.have.status(200);
        expect(result.body).to.not.be.empty;
        expect(result.body[1].affectedRows).to.equal(trueSubscriptions.length);
      })
      .catch(helpers.handler);
  });
});
