/* global expect, agent */

const moment = require('moment');
const helpers = require('../helpers');

describe('test/integration/stock Stock Depot RUMER data REST API', () => {
  it('GET /stock/rumer: test the RUMER data for a given depot', () => {
    const depotUuid = helpers.data.depots.principal;
    const startDate = '2022-01-01';
    const endDate = '2022-01-31';
    const NB_OF_INVENTORIES = 1;

    return agent
      .get(`/stock/rumer`)
      .query({
        depot_uuid : depotUuid,
        start_date : `${startDate}T00:00:00`, // Forces treating it as local time, not UTC
        end_date : `${endDate}T00:00:00`, // Forces treating it as local time, not UTC
      })
      .then((res) => {
        const data = res.body;

        const prefix = `${res.req.method} ${res.req.path}`;
        expect(data, `${prefix} returned a non-object`).to.be.a('object');

        // parameters of the request
        expect(data, `${prefix} does not returned params property`).to.have.property('params');
        const { params } = data;
        expect(params, `depot_uuid does not provided`).to.have.property('depot_uuid');
        expect(params.depot_uuid).to.be.eq(depotUuid);
        expect(params, `start_date does not provided`).to.have.property('start_date');
        expect(params.start_date).to.be.eq(startDate);
        expect(params, `end_date does not provided`).to.have.property('end_date');
        expect(params.end_date).to.be.eq(endDate);

        // header of the request
        expect(data, `${prefix} does not returned header property`).to.have.property('header');
        const { header } = data;
        const numDays = moment(params.end_date).diff(params.start_date, 'days');
        const expectedHeader = Array.from(Array(numDays + 1), (e, i) => i + 1);
        expect(header).to.be.deep.eq(expectedHeader);

        // configuration data
        expect(data, `${prefix} does not returned configurationData property`).to.have.property('configurationData');
        const { configurationData } = data;
        expect(configurationData).to.have.length(NB_OF_INVENTORIES);
        const [sample] = configurationData;
        const fields = [
          'inventoryUuid',
          'inventoryText',
          'quantityOpening',
          'quantityTotalEntry',
          'quantityTotalExit',
          'outQuantityConsumption',
          'outQuantityExit',
          'quantityEnding',
          'numStockOutDays',
          'percentStockOut',
          'dailyConsumption',
        ];
        fields.forEach(field => {
          expect(sample, `${field} does not provided`).to.have.property(field);
          if (field === 'dailyConsumption') {
            // get consumption for each day of the month
            expect(sample[field]).to.have.length(header.length);
          } else if (field === 'percentStockOut') {
            // the percentage of stock-out days is correctly calculated
            const { numStockOutDays } = sample;
            const percentStockOut = ((numStockOutDays / header.length) * 100).toFixed(1);
            expect(sample[field]).to.be.eq(`${percentStockOut}`);
          }
        });

        // summary data
        expect(data, `${prefix} does not returned totals property`).to.have.property('totals');
        const { totals } = data;
        const totalFields = [
          'totalDaysStockOut',
          'totalDays',
          'ratio',
          'colspan',
        ];
        totalFields.forEach(field => {
          expect(totals, `${field} does not provided`).to.have.property(field);
        });
      })
      .catch(helpers.handler);
  });
});
