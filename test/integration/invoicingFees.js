
 

const helpers = require('./helpers');

/*
 * The /invoicing_fees API
 */
describe('test/integration/invoicingFees Invoicing Fee API', () => {
  const invoicingFeeA = {
    account_id :  260, // 75881010 - Autres revenus
    label :       'Test Invoicing Fee A',
    description : 'This is definitely a Invoicing Fee.',
    value :       13.0,
  };

  // test negative values
  const invoicingFeeB = {
    account_id :  260, // 75881010 - Autres revenus
    label :       'Test Invoicing Fee B',
    description : 'Invoicing Fees should not have negative values, right?',
    value :       -15.0,
  };

  const responseKeys = [
    'id', 'account_id', 'label', 'description', 'value', 'number', 'created_at',
    'updated_at',
  ];

  it('GET /invoicing_fees should return a list of two Invoicing Fee', () => {
    return agent.get('/invoicing_fees')
      .then(res => {
        helpers.api.listed(res, 2);
      })
      .catch(helpers.handler);
  });

  it('GET /invoicing_fees/undefined should reject (404) an unknown id', () => {
    return agent.get('/invoicing_fees/undefined')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('POST /invoicing_fees should create a new, valid Invoicing Fee', () => {
    return agent.post('/invoicing_fees')
      .send({ invoicingFee : invoicingFeeA })
      .then(res => {
        helpers.api.created(res);

        // bind the database-generated ID
        invoicingFeeA.id = res.body.id;
        return agent.get(`/invoicing_fees/${invoicingFeeA.id}`);
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.contain.all.keys(responseKeys);

        // these props should be identical
        expect(res.body.id).to.equal(invoicingFeeA.id);
        expect(res.body.label).to.equal(invoicingFeeA.label);
        expect(res.body.description).to.equal(invoicingFeeA.description);
        expect(res.body.value).to.equal(invoicingFeeA.value);
      })
      .catch(helpers.handler);
  });

  it('POST /invoicing_fees should reject an invalid Invoicing Fee', () => {
    return agent.post('/invoicing_fees')
      .send({ invoicingFee : invoicingFeeB })
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('PUT /invoicing_fees should update a Invoicing Fee', () => {
    const label = 'Yadaya, I changed the label!';

    return agent.put(`/invoicing_fees/${invoicingFeeA.id}`)
      .send({ invoicingFee : { label } })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;

        // these props should be identical
        expect(res.body.id).to.equal(invoicingFeeA.id);
        expect(res.body.label).to.equal(label);
        expect(res.body.description).to.equal(invoicingFeeA.description);
        expect(res.body.value).to.equal(invoicingFeeA.value);
      })
      .catch(helpers.handler);
  });

  it('GET /invoicing_fees?detailed=1 should return a detailed list of three Invoicing Fees', () => {
    return agent.get('/invoicing_fees?detailed=1')
      .then(res => {
        helpers.api.listed(res, 3);
        expect(res.body[0]).to.contain.all.keys(responseKeys);
      })
      .catch(helpers.handler);
  });

  it('DELETE /invoicing_fees/undefined should return a 404 error', () => {
    return agent.delete('/invoicing_fees/undefined')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('DELETE /invoicing_fees/:id should delete an existing Invoicing Fee', () => {
    return agent.delete(`/invoicing_fees/${invoicingFeeA.id}`)
      .then(res => {
        helpers.api.deleted(res);
        return agent.get(`/invoicing_fees/${invoicingFeeA.id}`);
      })
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });
});
