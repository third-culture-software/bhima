/* global expect, agent */
const helpers = require('../helpers');

/*
 * The /stock/setting API
 * This test suite implements the Read-Update functions on the /stock_setting API.
 */
describe('test/integration/stock/stockSetting Stock Settings API', () => {
  const defaultEnterpriseId = 1;
  const defaultValuemonthAverageConsumption = 6;

  const update = {
    settings : {
      month_average_consumption : 10,
      average_consumption_algo : 'algo_msh',
    },
  };

  /* response keys from the list query */
  const responseKeys = [
    'month_average_consumption', 'default_min_months_security_stock',
    'enable_auto_purchase_order_confirmation', 'enable_auto_stock_accounting',
    'enable_strict_depot_permission', 'enable_supplier_credit', 'enable_strict_depot_distribution',
    'average_consumption_algo', 'min_delay', 'default_purchase_interval', 'enable_expired_stock_out',
    'default_cost_center_for_loss', 'enable_packaging_pharmaceutical_products', 'enable_requisition_validation_step',
    'enable_funding_source',
  ];

  it('GET /stock/setting/:id returns the stock settings for the default Enterprise and checks a value', () => {
    return agent.get(`/stock/setting`)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        const [settings] = res.body;
        expect(settings.month_average_consumption)
          .to.equal(defaultValuemonthAverageConsumption);
      })
      .catch(helpers.handler);
  });

  it('PUT /stock/setting/:id should update stock settings for the default enterprise', () => {
    return agent.put(`/stock/setting/${defaultEnterpriseId}`)
      .send(update)
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.an('object');
        expect(res.body.affectedRows).to.equal(1);
        // Check if the update is successful
        agent.get(`/stock/setting`)
          .then(res2 => {
            const [settings] = res2.body;
            expect(settings.month_average_consumption, update.settings.month_average_consumption);
            expect(settings.average_consumption_algo, update.settings.average_consumption_algo);
            expect(settings).to.have.all.keys(responseKeys);
          });
      })
      .catch(helpers.handler);
  });

  it('GET /stock/setting/:id returns a 404 error for unknown enterprise id', () => {
    return agent.get('/stock/setting/123456789')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('GET /stock/setting/:id returns a 404 error it the enterprises id is a string', () => {
    return agent.get('/stock/setting/str')
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

  it('PUT /stock/setting/:id returns a 404 for unknown enterprise id', () => {
    return agent.put(`/stock/setting/987654321`)
      .send(update)
      .then(res => {
        helpers.api.errored(res, 404);
      })
      .catch(helpers.handler);
  });

});
