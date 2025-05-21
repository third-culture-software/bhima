/* global expect, agent */
/* eslint-disable no-unused-expressions */

const uuid = require('uuid');
const helpers = require('./helpers');

const genuuid = () => uuid.v4().toUpperCase().replace(/-/g, '');

/*
 * The /vouchers API
 *
 * This test suit is about the vouchers table
 */
describe('test/integration/vouchers The vouchers HTTP endpoint', () => {
  const date = new Date();

  const vUuid = 'B140C1446CA847B099BA94732CF6EFDE';
  const pUuid = 'C144B1406CA847B099BA6EFDE94732CF';
  const numVouchers = 73;

  const TO_DELETE_UUID = '3688E9CE85EA4B5C9144688177EDCB63';

  // balanced transaction with two lines (USD)
  const voucher = {
    date,
    uuid        : vUuid,
    project_id  : 1,
    currency_id : helpers.data.USD,
    amount      : 10,
    type_id : 1,
    description : 'Voucher Transaction to BCDC',
    user_id     : 1,
    items       : [{
      uuid          : genuuid(),
      account_id    : 184,
      debit         : 10,
      credit        : 0,
      document_uuid : genuuid(),
      voucher_uuid  : vUuid,
    }, {
      account_id   : 217,
      debit        : 0,
      credit       : 10,
      voucher_uuid : vUuid,
    }],
  };

  // NOTE: this voucher does not have any uuids and uses hrEntity tags
  const items = [
    {
      account_id : 197, debit : 11, credit : 0, hrRecord : 'IV.TPA.1', hrEntity : 'PA.TPA.1',
    },
    {
      account_id : 191, debit : 0, credit : 11, hrRecord : 'VO.TPA.1',
    },
    { account_id : 197, debit : 0, credit : 12 },
    { account_id : 190, debit : 12, credit : 0 },
  ];

  const secondVoucher = {
    date,
    items,
    project_id  : 1,
    currency_id : helpers.data.USD,
    amount      : 23,
    type_id : 2,
    description : 'Multiple Voucher Transaction with PA.TPA.1 as entity',
    user_id     : 1,
  };

  // only one item - bad transaction
  const badVoucher = {
    date,
    uuid        : genuuid(),
    project_id  : 1,
    currency_id : helpers.data.USD,
    amount      : 10,
    description : 'Voucher Transaction',
    items       : [{
      uuid       : genuuid(),
      account_id : 177,
      debit      : 10,
      credit     : 0,
    }],
  };

  // this voucher will not have an exchange rate
  const predatedVoucher = {
    uuid        : genuuid(),
    date        : new Date('2000-01-01'),
    project_id  : 1,
    currency_id : helpers.data.FC,
    amount      : 10,
    type_id : 1,
    description : 'Voucher Transaction',
    user_id     : 1,
    items       : [{
      uuid       : genuuid(),
      account_id : 179,
      debit      : 10,
      credit     : 0,
    }, {
      uuid       : genuuid(),
      account_id : 191,
      debit      : 0,
      credit     : 10,
    }],
  };

  let mockVoucher;

  const voucherPaymentSalary = {
    date,
    uuid        : pUuid,
    project_id  : 1,
    currency_id : helpers.data.USD,
    amount      : 14.07,
    type_id : 7,
    description : 'Partial Paiement Salary [ 02 - 2018]',
    user_id     : 1,
    items       : [{
      uuid          : genuuid(),
      account_id    : 187,
      debit         : 0,
      credit        : 14.07,
      document_uuid : genuuid(),
      voucher_uuid  : pUuid,
    }, {
      account_id   : 179,
      debit        : 14.07,
      credit       : 0,
      document_uuid   : '2a3f17b0-ae32-42bb-9333-a760825fd257',
      voucher_uuid : pUuid,
      entity_uuid : '42d3756a-7770-4bb8-a899-7953cd859892',
      entity : {
        label : 'TEST 2 PATIENT',
        type  : 'C',
        uuid  : '42d3756a-7770-4bb8-a899-7953cd859892',
      },
    }],
  };

  it('POST /vouchers create a new voucher record in voucher and voucher_item tables', () => {
    return agent.post('/vouchers')
      .send({ voucher })
      .then((res) => {
        helpers.api.created(res);
        expect(res.body.uuid).to.be.equal(voucher.uuid);
      })
      .catch(helpers.handler);
  });

  function filterUniqueValues(row, index, array) {
    return array.indexOf(row) === index;
  }

  it('POST /vouchers create a new voucher record with multiple voucher_items', () => {
    return agent.post('/vouchers')
      .send({ voucher : secondVoucher })
      .then((res) => {
        helpers.api.created(res);

        // check that the voucher is linked the entities and records
        return agent.get(`/vouchers/${res.body.uuid}`);
      })
      .then(res => {
        expect(res.body.items).to.be.a('array');

        const entityUuids = res.body.items
          .map(row => row.entity_uuid)
          .filter(filterUniqueValues)
          .filter(value => value !== null);

        expect(entityUuids).to.have.length(1);

        const recordUuids = res.body.items
          .map(row => row.document_uuid)
          .filter(filterUniqueValues)
          .filter(value => value !== null);
        expect(recordUuids).to.have.length(2);
      })
      .catch(helpers.handler);
  });

  it('POST /vouchers doesn\'t register when missing data', () => {
    const uid = genuuid();
    mockVoucher = {
      date,
      uuid          : uid,
      project_id    : 1,
      currency_id   : 1,
      amount        : 10,
      description   : 'Bad Voucher Transaction',
      document_uuid : genuuid(), // technically, this should reference something..
      user_id       : 1,
      items         : [{
        account_id   : 3631,
        // missing debit field
        credit       : 0,
        voucher_uuid : uid,
      }],
    };

    return agent.post('/vouchers')
      .send({ voucher : mockVoucher })
      .then((res) => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('POST /vouchers will reject a voucher will less than two records', () => {
    // attempt 1 - missing items completely + bad voucher
    return agent.post('/vouchers')
      .send({ voucher : { uuid : genuuid() } })
      .then((res) => {
        helpers.api.errored(res, 400);

        // attempt 2 - only a single item
        return agent.post('/vouchers')
          .send({ voucher : badVoucher });
      })
      .then((res) => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('POST /vouchers will reject a voucher with an invalid exchange rate', () => {
    return agent.post('/vouchers')
      .send({ voucher : predatedVoucher })
      .then((res) => {
        helpers.api.errored(res, 400);
        expect(res.body.code).to.equal('ERRORS.NO_FISCAL_YEAR');
      })
      .catch(helpers.handler);
  });

  it('GET /vouchers?detailed=1 returns a list of vouchers', () => {
    return agent.get('/vouchers?detailed=1')
      .then((res) => {
        helpers.api.listed(res, numVouchers);
      })
      .catch(helpers.handler);
  });

  it('GET /vouchers/:uuid returns a detail of a specified vouchers', () => {
    return agent.get(`/vouchers/${voucher.uuid}`)
      .then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body.uuid).to.exist;
        expect(res.body.uuid).to.be.equal(voucher.uuid);
      })
      .catch(helpers.handler);
  });

  it('GET /vouchers/:uuid will send back a 404 if the vouchers uuid does not exist', () => {
    return agent.get('/vouchers/123456789')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /vouchers/:uuid will send back a 404 if the vouchers uuid is a string', () => {
    return agent.get('/vouchers/str')
      .then((res) => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /vouchers returns a list of vouchers specified by query string', () => {
    return agent.get('/vouchers/?reference=unknown&detailed=1')
      .then((res) => {
        helpers.api.listed(res, 0);
        return agent.get('/vouchers/?account_id=0000&detailed=1');
      })
      .then((res) => {
        helpers.api.listed(res, 0);
        return agent.get(`/vouchers/?project_id=${voucher.project_id}&reference=VO.TPA.1&detailed=1`);
      })
      .then((res) => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  it('GET /vouchers filters on reversed vouchers', () => {
    return agent.get('/vouchers')
      .query({ reversed : 1 })
      .then((res) => {
        helpers.api.listed(res, 2);
        return agent.get('/vouchers').query({ reversed : 0 });
      })
      .then((res) => {
        helpers.api.listed(res, 71);
        return agent.get('/vouchers').query({ reversed : '2' });
      })
      .then(res => {
        helpers.api.listed(res, 69);
      })
      .catch(helpers.handler);
  });

  it('DELETE /transactions/:uuid deletes a voucher', () => {
    return agent.delete(`/transactions/${TO_DELETE_UUID}`)
      .then(res => {
        expect(res).to.have.status(201);
        return agent.get(`/vouchers/${TO_DELETE_UUID}`);
      })
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('POST /vouchers create a voucher record For Paiement Salary', () => {
    return agent.post('/vouchers')
      .send({ voucher : voucherPaymentSalary })
      .then((res) => {
        helpers.api.created(res);
        expect(res.body.uuid).to.be.equal(voucherPaymentSalary.uuid);
      })
      .catch(helpers.handler);
  });
});
