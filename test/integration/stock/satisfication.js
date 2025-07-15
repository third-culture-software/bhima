/* global expect, agent */

const moment = require('moment');
const helpers = require('../helpers');

const today = new Date();

describe('test/integration/stock Test the stock satisfaction rate REST API', () => {

  it('GET /stock/satisfication_rate', () => {
    const options = {
      dateFrom : moment(today).subtract(366, 'days').toDate(),
      dateTo : moment(today).subtract(1, 'days').toDate(),
      depotUuids : [
        'F9CAEB16168443C5A6C447DBAC1DF296',
        'D4BB1452E4FA4742A281814140246877',
      ],
    };

    return agent.get('/stock/satisfaction_rate')
      .query(options)
      .then((res) => {
        const { depotsListSupplier, suppliersList } = res.body;

        expect(depotsListSupplier.length).to.equal(2);
        expect(suppliersList.length).to.equal(2);

        // Spot check the top-level data for the first Depot
        const depot1 = depotsListSupplier[0].data[0];
        expect(depot1.depot_requisition.beneficiary).to.equal('Depot Secondaire');
        expect(depot1.depot_requisition.satisfaction_rate_quantity).to.equal(0);
        expect(depot1.depot_requisition.satisfaction_rate_item).to.equal(0);

        // The following work around because at certain times of day, this varies
        expect([2, 4]).to.include(depot1.data_requisition_movement.length);

        // Spot check a movement
        const movements = depot1.data_requisition_movement.sort((a, b) => a.quantity_requested - b.quantity_requested);
        const mov = movements[0];
        expect(mov.requisition_reference).to.equal('SREQ.TPA.2');
        expect(mov.quantity_requested).to.equal(4);
        expect(mov.quantity_validated).to.equal(4);
        expect(mov.satisfaction_rate).to.equal(0);

        // Check suppliers
        const suppliers = suppliersList.map(item => item.depot_text).sort();
        expect(suppliers[0]).to.equal('Depot Principal');
        expect(suppliers[1]).to.equal('Depot Secondaire');
      })
      .catch(helpers.handler);
  });

});
