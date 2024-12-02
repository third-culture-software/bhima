/* global expect, agent */
/* eslint-disable no-unused-expressions */

const helpers = require('./helpers');

describe('test/integration/debtorGroups The debtor groups API', () => {
  const numDebtorGroups = 7;

  const debtorGroup = {
    enterprise_id : 1,
    name : 'New Debtor Group (Test)',
    account_id : 174,
    location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
    phone : '0811838662',
    email : 'debtorgroup@info.com',
    note : 'Nouveau debtor group de test',
    locked : 0,
    max_credit : null,
    is_convention : 0,
    price_list_uuid : null,
    apply_discounts : 0,
    apply_invoicing_fees : 0,
    apply_subsidies : 0,
  };

  const updateGroup = {
    enterprise_id : 1,
    name : 'Updated Debtor Group (Test)',
    account_id : 174,
    location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
    phone : '0818061031',
    email : 'update@info.com',
    note : 'Updated debtor group de test',
    locked : 1,
    max_credit : 1000,
    is_insolvent : 0,
    is_non_client_debtor_groups : 0,
    is_convention : 1,
    price_list_uuid : helpers.data.PRICE_LIST,
    apply_discounts : 1,
    apply_invoicing_fees : 1,
    apply_subsidies : 1,
    color : '#FF0000',
  };

  const lockedGroup = {
    enterprise_id : 1,
    name : 'Locked Debtor Group (Test)',
    account_id : 175,
    location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
    phone : '0811838662',
    email : 'debtorgroup@info.com',
    note : 'Nouveau debtor group de test',
    locked : 1,
    max_credit : 0,
    is_convention : 0,
    price_list_uuid : null,
    apply_discounts : 0,
    apply_invoicing_fees : 0,
    apply_subsidies : 0,
  };

  const conventionGroup = {
    enterprise_id : 1,
    name : 'Convention Debtor Group (Test)',
    account_id : 176,
    location_id : '1f162a109f6747889effc1fea42fcc9b',
    phone : '0811838662',
    email : 'debtorgroup@info.com',
    note : 'Nouveau debtor group de test',
    locked : 0,
    max_credit : null,
    is_convention : 1,
    price_list_uuid : null,
    apply_discounts : 0,
    apply_invoicing_fees : 0,
    apply_subsidies : 0,
  };

  const lockedConventionGroup = {
    enterprise_id : 1,
    name : 'Locked Convention Debtor Group (Test)',
    account_id : 174,
    location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
    phone : '0811838662',
    email : 'debtorgroup@info.com',
    note : 'Nouveau debtor group de test',
    locked : 1,
    max_credit : null,
    is_convention : 1,
    price_list_uuid : null,
    apply_discounts : 0,
    apply_invoicing_fees : 0,
    apply_subsidies : 0,
  };

  const invalidGroup = {
    enterprise_id : 1,
    name : 'Invalid Debtor Group (Test)',
    location_id : '1F162A109F6747889EFFC1FEA42FCC9B',
    phone : '0811838662',
    email : 'debtorgroup@info.com',
    note : 'Nouveau debtor group de test',
  };

  let allDebtorGroups;

  it('POST /debtor_groups/ creates a new debtor group (unlocked)', () => {
    return agent.post('/debtor_groups/')
      .send(debtorGroup)
      .then(res => {
        helpers.api.created(res);
        debtorGroup.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('POST /debtor_groups/ creates a new debtor group (locked)', () => {
    return agent.post('/debtor_groups/')
      .send(lockedGroup)
      .then(res => {
        helpers.api.created(res);
        lockedGroup.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('POST /debtor_groups/ creates a new debtor group (convention)', () => {
    return agent.post('/debtor_groups/')
      .send(conventionGroup)
      .then(res => {
        helpers.api.created(res);
        conventionGroup.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('POST /debtor_groups/ creates a new debtor group (locked convention)', () => {
    return agent.post('/debtor_groups/')
      .send(lockedConventionGroup)
      .then(res => {
        helpers.api.created(res);
        lockedConventionGroup.uuid = res.body.uuid;
      })
      .catch(helpers.handler);
  });

  it('POST /debtor_groups does not create a record when data is missing', () => {
    return agent.post('/debtor_groups')
      .send(invalidGroup)
      .then(res => {
        helpers.api.errored(res, 400);
      })
      .catch(helpers.handler);
  });

  it('GET /debtor_groups returns a list of debtor groups', () => {
    return agent.get('/debtor_groups')
      .then(res => {
        helpers.api.listed(res, numDebtorGroups);
        allDebtorGroups = res.body;
      })
      .catch(helpers.handler);
  });

  it('GET /debtor_groups?detailed=1 returns a more complex (detailed) list', () => {
    return agent.get('/debtor_groups')
      .query({ detailed : 1 })
      .then(res => {
        // expects status + type JSON
        helpers.api.listed(res, numDebtorGroups);

        const sampleDebtorGroup = res.body[1];

        // verify complex query attributes returned
        expect(sampleDebtorGroup).to.contain.all.keys('total_debtors');

        // according to the test SQL data this debtor group should have 3 debtors assigned
        /* @todo verify that the order of data sent back from the server is managed/ known */
        // expect(sampleDebtorGroup.total_debtors).to.equal(expectedDebtors);
      })
      .catch(helpers.handler);
  });

  it('GET /debtor_groups/:uuid returns all details for a valid debtor group', () => {
    return agent.get(`/debtor_groups/${debtorGroup.uuid}`)
      .then(res => {
        const expectedKeySubset = ['uuid', 'account_id', 'name', 'location_id', 'is_convention'];
        expect(res).to.have.status(200);
        expect(res.body).to.contain.all.keys(expectedKeySubset);
      })
      .catch(helpers.handler);
  });

  it('GET /debtor_groups/:uuid returns NOT FOUND (404) for an invalid uuid', () => {
    return agent.get('/debtor_groups/invalid')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /debtor_groups?locked={1|0} returns only locked or not locked debtor groups', () => {
    const totalLockedGroup = getTotal(allDebtorGroups, 'locked', 1);
    const totalUnlockedGroup = getTotal(allDebtorGroups, 'locked', 0);

    return agent.get('/debtor_groups')
      .query({ locked : 1 })
      .then(res => {
        helpers.api.listed(res, totalLockedGroup);
        expect(res.body[0].locked).to.be.equal(1);
        return agent.get('/debtor_groups/').query({ locked : 0 });
      })
      .then(res => {
        helpers.api.listed(res, totalUnlockedGroup);
        expect(res.body[0].locked).to.be.equal(0);
      })
      .catch(helpers.handler);
  });

  it('GET /debtor_groups?is_convention={1|0} returns only conventions or not conventions debtor groups', () => {
    const totalConvention = getTotal(allDebtorGroups, 'is_convention', 1);
    const totalNotConvention = getTotal(allDebtorGroups, 'is_convention', 0);

    return agent.get('/debtor_groups').query({ is_convention : 1 })
      .then(res => {
        helpers.api.listed(res, totalConvention);
        expect(res.body[0].is_convention).to.be.equal(1);
        return agent.get('/debtor_groups').query({ is_convention : 0 });
      })
      .then(res => {
        helpers.api.listed(res, totalNotConvention);
        expect(res.body[0].is_convention).to.be.equal(0);
      })
      .catch(helpers.handler);
  });

  it('GET /debtor_groups/?locked={1|0}&is_convention={1|0} returns either locked or convention debtor groups', () => {
    return agent.get('/debtor_groups/')
      .query({ locked : 1, is_convention : 1 })
      .then(res => {
        helpers.api.listed(res, 1);
        expect(res.body[0].locked).to.be.equal(1);
        expect(res.body[0].is_convention).to.be.equal(1);
        return agent.get('/debtor_groups/')
          .query({ locked : 1, is_convention : 0 });
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body[0].locked).to.be.equal(1);
        expect(res.body[0].is_convention).to.be.equal(0);
        return agent.get('/debtor_groups/')
          .query({ locked : 0, is_convention : 1 });
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body[0].locked).to.be.equal(0);
        expect(res.body[0].is_convention).to.be.equal(1);
        return agent.get('/debtor_groups/')
          .query({ locked : 0, is_convention : 0 });
      })
      .then(res => {
        expect(res).to.have.status(200);
        expect(res.body).to.not.be.empty;
        expect(res.body[0].locked).to.be.equal(0);
        expect(res.body[0].is_convention).to.be.equal(0);
      })
      .catch(helpers.handler);
  });

  it('PUT /debtor_groups/:uuid update a debtor group', () => {
    return agent.put(`/debtor_groups/${debtorGroup.uuid}`)
      .send(updateGroup)
      .then(res => {
        updateGroup.uuid = debtorGroup.uuid;

        // data provided by the server; always blank for new debtor groups
        updateGroup.invoicingFees = [];
        updateGroup.subsidies = [];

        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.deep.equal(updateGroup);
      })
      .catch(helpers.handler);
  });

  it('DELETE /debtor_groups/:uuid should delete an existing debtor group', () => {
    return agent.delete(`/debtor_groups/${lockedConventionGroup.uuid}`)
      .then(res => {
        helpers.api.deleted(res);
        return agent.get(`/debtor_groups/${lockedConventionGroup.uuid}`);
      })
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  /**
   * @todo: Need to be implemented at the server side in
   * /server/controllers/debtors/groups/index.js  #function invoices
   */
  it('GET /debtor_groups/:uuid/invoices returns all invoices for a debtor group', () => {
    return agent.get(`/debtor_groups/${debtorGroup.uuid}/invoices`)
      .then(res => {
        expect(res).to.have.status(200);
      })
      .catch(helpers.handler);
  });

  it('GET /debtor_groups/:uuid/invoices returns only balanced invoices for a debtor group', () => {
    return agent.get(`/debtor_groups/${debtorGroup.uuid}/invoices`).query({ balanced : 1 })
      .then(res => {
        helpers.api.listed(res, 0);
      })
      .catch(helpers.handler);
  });

  /**
   * @function getTotal
   *
   * @desc Get number of element in {array} by criteria and value
   *
   * @param {array} array The array of objects
   * @param {string} criteria A property of item in {array}
   * @param {mixed} value A value of the property
   */
  function getTotal(array, criteria, value) {
    return array.filter(item => item[criteria] === value).length;
  }
});
