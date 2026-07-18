/**
 * @file CashInvoicePayments
 * @description
 * This file contains tests for the posting routine of cash payments.
 */
const helpers = require('./helpers');

module.exports = PatientInvoicePayments;

/**
 *
 */
function PatientInvoicePayments() {
  const DEBTOR_UUID = '3be232f9-a4b9-4af6-984c-5d3f87d5c107';

  const defaults = {
    currency_id : 1, // FCs
    cashbox_id : 1, // Caisse Principale
    project_id : 1, // Test Project
    debtor_uuid : DEBTOR_UUID,
    user_id : 1, // Test User
  };

  const INVOICES = [ // invoices defined in the database
    { invoice_uuid : '957e4e79-a6bb-4b4d-a8f7-c42152b2c2f6' },
    { invoice_uuid : 'c44619e0-3a88-4754-a750-a414fc9567bf' },
  ];

  const INV_1 = 'c44619e0-3a88-4754-a750-a414fc9567bf';
  const INV_2 = 'ceed8548-654f-4071-b60b-b85f04acbb59';

  const INVOICE_PAYMENT = {
    amount : 79000,
    date : new Date(),
    items : INVOICES,
    is_caution : 0,
    description : 'Test Cash Payment',
    ...defaults,
  };

  const INVALID_INVOICE_PAYMENT = {
    amount : 1520,
    description : 'This an invalid description',
    items : [],
    is_caution : 0,
    ...defaults,
  };

  const CONFUSED_PAYMENT = {
    amount : 15000,
    description : 'This is a confused payment (both items + is_caution are set)',
    items : INVOICES,
    date : new Date(),
    is_caution : 1,
    ...defaults,
  };

  // create a cash payment
  it('POST /cash should create a cash payment against multiple invoices', () => {
    return agent.post('/cash')
      .send({ payment : INVOICE_PAYMENT })
      .then((res) => {
        // checks to see that the record was a successful api created response
        helpers.api.created(res);

        // store the payment id for later
        INVOICE_PAYMENT.uuid = res.body.uuid;

        // make sure the payment is retrievable
        return agent.get(`/cash/${INVOICE_PAYMENT.uuid}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.items).to.have.length(2);

        expect(res.body.uuid).to.equal(INVOICE_PAYMENT.uuid);
        expect(res.body.is_caution).to.equal(INVOICE_PAYMENT.is_caution);
        expect(res.body.currency_id).to.equal(INVOICE_PAYMENT.currency_id);
        expect(res.body.cashbox_id).to.equal(INVOICE_PAYMENT.cashbox_id);

        const [payment1, payment2] = res.body.items;

        expect(payment1.amount).to.equal(23250)
        expect(payment2.amount).to.equal(55750)

        // check the posting journal fields to ensure the amoount is correct.
        return agent.get(`/journal/${res.body.uuid}`);
      })
      .then(res => {
        // the transaction should be a three line transaction.
        helpers.api.listed(res, 3)

        // these records do not have a stable sorting interface, so we will sort by the reference_uuid 
        const  records = res.body.sort((a, b) => String(b.reference_uuid).localeCompare(String(a.reference_uuid)));
        console.log('records', records);

        const  [debtor, payment1, payment2] = records;

        // check that the debtor line is correct
        expect(debtor.currency_id).to.equal(INVOICE_PAYMENT.currency_id);
        expect(debtor.debit).to.equal(INVOICE_PAYMENT.amount);
        expect(debtor.credit).to.equal(0);
        expect(debtor.record_uuid).to.equal(INVOICE_PAYMENT.uuid);
        expect(debtor.entity_uuid).to.equal(null);

        // this is the excahnge rate reported by the application on MySQL 8.4
        expect(debtor.rate).to.equal(0.001075268817204301);

        // check the payment amounts 
        expect(payment1.reference_uuid).to.equal(INV_1);
        expect(payment1.debit).to.equal(0);
        expect(payment1.debit_equiv).to.equal(0);
        expect(payment1.credit).to.equal(23250, 'Payment 2: Expected credit to equal the invoice amount.');
        expect(payment1.credit_equiv).to.equal(25, 'Payment 2: Expected credit_equiv to equal the invoice amount valued at the current exchange rate.');
        expect(payment1.entity_uuid).to.equal(DEBTOR_UUID, 'Payment 2: Expected the debotor_uuid of the transaction to be the debtor of the cash payment.');

        // second payment amount
        expect(payment2.reference_uuid).to.equal('957e4e79-a6bb-4b4d-a8f7-c42152b2c2f6');
        expect(payment2.debit).to.equal(0);
        expect(payment2.debit_equiv).to.equal(0);
        expect(payment2.credit).to.equal(55750, 'Payment 1: Expected credit to equal the invoice amount.');
        expect(payment2.credit_equiv).to.equal(59.9462, 'Payment 1: Expected credit_equiv to equal the invoice amount valued at the current exchange rate.');
        expect(payment2.entity_uuid).to.equal(DEBTOR_UUID, 'Payment 1: Expected the debotor_uuid of the transaction to be the debtor of the cash payment.');

      })
      .catch(helpers.handler);
  });

  it('POST /cash should not create a cash payment if cash items are empty', function () {  
    return agent.post('/cash')
      .send({ payment : INVALID_INVOICE_PAYMENT })
      .then((res) => {
        // anticipate a 400 error from the API.
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('PUT /cash/:uuid should update editable fields on a previous cash payment', () => {
    const DESC = 'I\'m adding a description!';

    return agent.put(`/cash/${INVOICE_PAYMENT.uuid}`)
      .send({ description : DESC })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;
        return agent.get(`/cash/${INVOICE_PAYMENT.uuid}`);
      })
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.not.be.empty;

        expect(res.body.items).to.have.length(2);

        expect(res.body.is_caution).to.equal(INVOICE_PAYMENT.is_caution);
        expect(res.body.description).to.equal(DESC);
      })
      .catch(helpers.handler);
  });

  it('PUT /cash/:uuid should not update non-editable fields on a previous cash payment', () => {
    return agent.put(`/cash/${INVOICE_PAYMENT.uuid}`)
      .send({ amount : 123000.13 })
      .then((res) => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  // make sure we can find the cash payment
  it('GET /cash/:uuid should return the full payment details of a cash payment', () => {
    return agent.get(`/cash/${INVOICE_PAYMENT.uuid}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body).to.have.keys(
          'uuid', 'barcode', 'reference', 'date', 'debtorName',
          'debtorReference', 'created_at', 'debtor_uuid', 'project_id', 'currency_id', 'items',
          'cashbox_id', 'amount', 'user_id', 'description', 'is_caution', 'edited', 'posted',
        );
      })
      .catch(helpers.handler);
  });

  // should not allow nefarious requests
  it('POST /cash should not process cash_items if is_caution flag is set', () => {
    return agent.post('/cash')
      .send({ payment : CONFUSED_PAYMENT })
      .then((res) => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  // Check if the invoice is paid
  it('GET /cash/:checkin should found one invoice paid', () => {
    return agent.get(`/cash/checkin/${INV_1}`)
      .then((res) => {
        expect(res).to.be.json;
        expect(res).to.have.status(200);
        expect(res.body.length).to.equal(1);
      })
      .catch(helpers.handler);
  });

  // Check if the invoice is not paid
  it('GET /cash/:checkin sould found zero invoice paid', () => {
    return agent.get(`/cash/checkin/${INV_2}`)
      .then((res) => {
        expect(res).to.be.json;
        expect(res).to.have.status(200);
        expect(res.body.length).to.equal(0);
      })
      .catch(helpers.handler);
  });
}
