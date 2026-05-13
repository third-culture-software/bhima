
const helpers = require('./helpers');

/*
 * The /discounts API
 */
describe('test/integration/discounts Discounts Interface', () => {
  // FIXME(@jniles) - make a discount account.
  const ACCOUNT_ID = 220; // 66110011 - Remunération Personnel

  // Quinine
  const INVENTORY_UUID = '43f3decb-fce9-426e-940a-bc2150e62186';

  const KEYS = [
    'id', 'account_id', 'inventory_uuid', 'number', 'inventoryLabel',
    'label', 'description', 'value',
  ];

  const mockDiscount = {
    label :          'Test Discount A',
    description :    'This is a mock discount for testing purposes.',
    account_id :     ACCOUNT_ID,
    inventory_uuid : INVENTORY_UUID,
    value :          15,
  };

  const mockDiscountNegative = {
    label :          'Test Discount B',
    description :    'This is a mock (negative) discount for testing purposes.',
    account_id :     ACCOUNT_ID,
    inventory_uuid : INVENTORY_UUID,
    value :          -125.00,
  };

  it('GET /discounts/undefined returns a 404 error', () => {
    return agent.get('/discounts/undefined')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /discounts returns an empty array of discounts', () => {
    return agent.get('/discounts')
      .then(res => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

  it('POST /discounts should create a new discount record', () => {
    return agent.post('/discounts')
      .send({ discount : mockDiscount })
      .then(res => {
        helpers.api.created(res);

        // bind the returned ID
        mockDiscount.id = res.body.id;

        // ensure it actually exists in the database
        return agent.get(`/discounts/${mockDiscount.id}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.keys(KEYS);

        // exhaustively make sure all properties were inserted correctly
        const isIdentical = helpers.identical(mockDiscount, res.body);
        expect(isIdentical).to.equal(true);
      })
      .catch(helpers.handler);
  });

  it('POST /discounts should reject a discount record with a negative value', () => {
    return agent.post('/discounts')
      .send({ discount : mockDiscountNegative })
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('GET /discounts returns an array of precisely one value', () => {
    return agent.get('/discounts')
      .then(res => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it('PUT /discounts/:id updates a discount record', () => {
    const newLabel = 'I\'m a new label!';
    return agent.put(`/discounts/${mockDiscount.id}`)
      .send({ label : newLabel })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.keys(KEYS);
        expect(res.body.label).to.equal(newLabel);
        expect(res.body.id).to.equal(mockDiscount.id);
      })
      .catch(helpers.handler);
  });

  it('DELETE /discounts/undefined should return a 404 error', () => {
    return agent.delete('/discounts/undefined')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /discounts/:id should successfully delete a discount', () => {
    return agent.delete(`/discounts/${mockDiscount.id}`)
      .then(res => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });
});
