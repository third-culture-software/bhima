/* global expect, agent */

const helpers = require('./helpers');

// The /depots API
describe('test/integration-stock/depots The depots API ', () => {
  const { principal } = helpers.data.depots;

  /**
   * In the depot principal, the cost of oxitocine is 7.06, and its quantity before the new entry is 9110
   * the current stock value for oxytocine is 9110 * 7.06 = 64316.60
   */
  const CURRENT_STOCK_VALUE = 64316.60;

  /**
   * In the depot principal, the entry of oxytocine has as cost 9 and quantity 5000
   * the incoming stock value for oxytocine is 5000 * 9 = 45000
   */
  const INCOMING_STOCK_VALUE = 45000;

  /**
   * After the entry of oxytocine, the final quantity is 9110 + 5000 = 14110
   */
  const FINAL_STOCK_QUANTITY = 14110;

  /**
   * The WAC (Weighted Avarage Cost) is :
   * (CURRENT_STOCK_VALUE + INCOMING_STOCK_VALUE) / FINAL_STOCK_QUANTITY
   * NOTA: From the 3rd decimal place after the decimal point,
   *       the EXPECTED_WAC is different from what the procedure `ComputeInventoryStockValue` compute
   */
  const EXPECTED_WAC = Number((CURRENT_STOCK_VALUE + INCOMING_STOCK_VALUE) / FINAL_STOCK_QUANTITY).toFixed(2);

  it('GET /depots/:uuid/inventories returns inventory for a depot (integration-stock)', () => {
    const principalInventoryItems = [
      'Ampicilline, 500mg, Vial, Unité',
      'Oxytocine, 10 UI/ml, 1ml, Amp, Unité',
      'Quinine bichlorhydrate base, 500mg/2ml, 2ml Amp',
    ];

    return agent.get(`/depots/${principal}/inventories`)
      .then(res => {
        helpers.api.listed(res, 3);

        const unique = (item, index, array) => array.indexOf(item) === index;

        // assert that only inventory from this depot were recovered
        const uniqueDepots = res.body
          .map(row => row.depot_text)
          .filter(unique);

        expect(uniqueDepots).to.have.length(1);
        expect(uniqueDepots[0]).to.equal('Depot Principal');

        // the inventory items should be distinct
        const uniqueInventory = res.body
          .map(row => row.text)
          .filter(unique);

        expect(uniqueInventory).to.have.length(3);
        expect(uniqueInventory).to.deep.equal(principalInventoryItems);
      })
      .catch(helpers.handler);
  });

  it('GET /depots/:uuid/users returns the users who have access to a depot', () => {
    return agent.get(`/depots/${principal}/users`)
      .then(res => {
        helpers.api.listed(res, 1);

        const [user] = res.body;
        expect(user.username).to.equal('superuser');
      })
      .catch(helpers.handler);
  });

  // @TODO: Fix this test so it deals with February 29 correctly
  it.skip('GET /depots/:uuid/inventories/:uuid/cmm returns the CMM for a depot', async () => {
    const { quinine, oxytocine, ampicilline } = helpers.data.inventories;
    try {
      let res = await agent.get(`/depots/${principal}/inventories/${quinine}/cmm`);

      expect(res).to.be.json; // eslint-disable-line

      let values = {
        algo_def : 48.47,
        algo_msh : 48.33,
        sum_days : 365,
        sum_stock_day : 365,
        sum_consumption_day : 9,
        sum_consumed_quantity : 580,
        number_of_month : 12,
        sum_stock_out_days : 0,
        head_days : 29,
      };

      expect(res.body.algo_def, 'quinine CMM algorithm 1 is not calculated correctly').to.equal(values.algo_def);
      expect(res.body.algo_msh, 'quinine CMM algorithm MSH is not calculated correctly').to.equal(values.algo_msh);

      expect(res.body, 'quinine CMM not calculated correctly').to.deep.include(values);

      res = await agent.get(`/depots/${principal}/inventories/${oxytocine}/cmm`);
      values = {
        algo_def : 72.28,
        algo_msh : 72.08,
        sum_days : 365,
        sum_stock_day : 365,
        sum_consumption_day : 8,
        sum_consumed_quantity : 865,
        number_of_month : 12,
        sum_stock_out_days : 0,
        head_days : 60,
      };

      expect(res.body.algo_def, 'oxytocine CMM algorithm 1 is not calculated correctly').to.equal(values.algo_def);
      expect(res.body.algo_msh, 'oxytocine CMM algorithm MSH is not calculated correctly').to.equal(values.algo_msh);
      expect(res.body, 'oxytocine CMM not calculated correctly').to.deep.include(values);

      res = await agent.get(`/depots/${principal}/inventories/${ampicilline}/cmm`);
      values = {
        algo_def : 30.16,
        algo_msh : 30.05,
        sum_days : 365,
        sum_stock_day : 273,
        sum_consumption_day : 8,
        sum_consumed_quantity : 270,
        number_of_month : 12,
        sum_stock_out_days : 92,
        head_days : 29,
      };

      expect(res.body.algo_def, 'ampicilline CMM algorithm 1 is not calculated correctly').to.equal(values.algo_def);
      expect(res.body.algo_msh, 'ampicilline CMM algorithm MSH is not calculated correctly').to.equal(values.algo_msh);
      expect(res.body, 'ampicilline CMM not calculated correctly').to.deep.include(values);
    } catch (err) {
      helpers.handler(err);
    }
  });

  it('GET /depots/:uuid/inventories/:uuid/lots returns the lots for a depot', () => {
    const { quinine } = helpers.data.inventories;
    return agent.get(`/depots/${principal}/inventories/${quinine}/lots`)
      .then(res => {
        helpers.api.listed(res, 4);

        const unique = (item, index, array) => array.indexOf(item) === index;

        // assert that only inventory from this depot were recovered
        const uniqueDepots = res.body
          .map(row => row.depot_text)
          .filter(unique);

        expect(uniqueDepots).to.have.length(1);
        expect(uniqueDepots[0]).to.equal('Depot Principal');

        // the inventory items should be distinct
        const uniqueInventory = res.body
          .map(row => row.text)
          .filter(unique);

        expect(uniqueInventory).to.have.length(1);
        expect(uniqueInventory[0]).to.equal(
          'Quinine bichlorhydrate base, 500mg/2ml, 2ml Amp',
        );

        const uniqueLots = res.body
          .map(row => row.label)
          .filter(unique)
          .sort();

        expect(uniqueLots).to.have.length(4);
        expect(uniqueLots).to.deep.equal([
          'QUININE-A-XXX',
          'QUININE-B-XXX',
          'QUININE-C-XXX',
          'QUININE-D-XXX',
        ]);
      })
      .catch(helpers.handler);
  });

  // mock today's date
  const [today] = new Date().toISOString().split('T');

  let WAC_FROM_PROCEDURE;
  let WAC_FROM_STOCK_SHEET;

  it(`GET /depots/:uuid/inventories/:uuid/wac returns the WAC for an inventory`, async () => {
    const { oxytocine } = helpers.data.inventories;
    const res = await agent.get(`/depots/${principal}/inventories/${oxytocine}/wac`);
    WAC_FROM_PROCEDURE = Number(res.body.wac).toFixed(2);
    expect(res.body.quantity).to.equal(FINAL_STOCK_QUANTITY);
    expect(WAC_FROM_PROCEDURE).to.equal(EXPECTED_WAC);
  });

  it(`GET /depots/:uuid/inventories/:uuid/sheet_wac returns the WAC from stock sheet`, async () => {
    const { oxytocine } = helpers.data.inventories;
    const res = await agent.get(`/depots/${principal}/inventories/${oxytocine}/sheet_wac`);
    const { stock } = res.body.result;
    WAC_FROM_STOCK_SHEET = Number(stock.unit_cost).toFixed(2);
    expect(stock.quantity).to.equal(FINAL_STOCK_QUANTITY);
    expect(WAC_FROM_STOCK_SHEET).to.equal(EXPECTED_WAC);
    expect(WAC_FROM_STOCK_SHEET).to.equal(WAC_FROM_PROCEDURE);
  });

  it('GET /depots/:uuid/flags/stock_out returns the stock in a depot', async () => {
    const res = await agent.get(`/depots/${principal}/flags/stock_out`).query({ date : today });
    helpers.api.listed(res, 1);
    const [ampicilline] = res.body;
    expect(ampicilline.quantity).to.equal(0);
  });

  it('GET /depots should returns the list of depots', () => {
    return agent.get('/depots')
      .then((res) => {
        helpers.api.listed(res, 3);
      })
      .catch(helpers.handler);
  });

  it('GET /depots/:uuid/stock returns the stock in a depot', async () => {
    const res = await agent.get(`/depots/${principal}/stock`).query({ date : today });
    helpers.api.listed(res, 3);

    // check the quantites of each individual article
    const [oxytocineLotA, oxytocineLotB, quinine] = res.body;

    expect(oxytocineLotA.quantity).to.equal(9110);
    expect(oxytocineLotB.quantity).to.equal(5000);
    expect(quinine.quantity).to.equal(360);
  });
});
