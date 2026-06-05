

const moment = require('moment');
const helpers = require('../helpers');

/**
 *
 * @param date1
 * @param date2
 * @param msg
 */
function compareDate(date1, date2, msg) {
  expect(date1.getFullYear(), `${msg} (year does not match)`).to.equal(date2.getFullYear());
  expect(date1.getMonth(), `${msg} (month does not match)`).to.equal(date2.getMonth());
  expect(date1.getDate(), `${msg} (day does not match)`).to.equal(date2.getDate());
}

describe('test/integration/inventory/lot_schedule Inventory lots schedule HTML REST API', () => {

  it('GET /inventory/:uuid/schedule: test usage schedule for QUININE (DORA_QUIN1S-_0)', () => {
    const uuid = helpers.data.QUININE;
    const depotUuid = helpers.data.depots.principal;
    const numMonths = 3;
    return agent.get(`/inventory/${uuid}/schedule/${depotUuid}`)
      .query({
        interval_num_months : numMonths,
        // month_average_consumption : 6,
        // average_consumption_algo : 'algo_msh',
      })
      .then(res => {
        const today = new Date();
        const lots = res.body;

        expect(lots.length).to.equal(2);

        // Check the first lot
        const B = lots[0];
        const startB = new Date(B.start_date);
        const endB = new Date(B.end_date);
        expect(B.label).to.equal('QUININE-B');
        compareDate(startB, today, 'Lot QUININE-B start date error');
        compareDate(endB, moment(today).add(1, 'months').toDate(), 'Lot QUININE-B end date error');
        expect(B.quantity_used).to.equal(0);
        expect(B.quantity_wasted).to.equal(15);
        expect(B.value_wasted).to.equal(12);

        // Check the second lot
        const C = lots[1];
        const startC = new Date(C.start_date);
        const endC = new Date(C.end_date);
        expect(C.label).to.equal('QUININE-C');
        compareDate(startC, endB, 'Lot QUININE-C start date error');
        compareDate(endC, moment(startC).add(numMonths, 'months').toDate(), 'Lot QUININE-C end date error');
        // Note: Nothing wasted because the expiration date is after our interval
        expect(C.quantity_used).to.equal(50);
        expect(C.quantity_wasted).to.equal(0);
        expect(C.value_wasted).to.equal(0);
      })
      .catch(helpers.handler);
  });

});
