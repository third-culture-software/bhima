/* eslint global-require:off */
const { expect } = require('chai');
const { randomUUID } = require('node:crypto');

const uuid = () => randomUUID().toUpperCase().replace(/-/g, '');

describe('test/server-unit/purchases/purchases', () => {

  let db;
  before(() => {
    db = require('../../../server/lib/db');
  });

  it('should remove purchase items on purchase delete', async () => {
    // test setup - create a purchase order
    const puid = uuid();
    const prednisone = 'c3fd5a02-6a75-49fc-b2f3-76ee4c3fbfb7';

    // create the purchase order
    await db.exec(`
      INSERT INTO purchase VALUES (
        HUID('${puid}'), 2, 1, 300, 0, 2, HUID('3ac4e83c-65f2-45a1-8357-8b025003d793'),
        DATE_ADD(CURRENT_DATE, INTERVAL -1725 DAY), CURRENT_TIMESTAMP, NULL, 1, NULL, NULL, FALSE, 1,
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
      );
    `);

    // create a purchase item linked to the above purchase order.
    await db.exec(`INSERT INTO purchase_item VALUES
      (HUID('${uuid()}'), HUID('${puid}'), HUID('${prednisone}'), 2000, 0.15, (2000 * 0.15), 1);`);

    const [purchase] = await db.exec(`SELECT * FROM purchase WHERE uuid = HUID('${puid}');`);
    expect(purchase.cost).to.equal(300);

    // okay, now that we know our data is built, actually test if the data is deleted
    // correctly.
    await db.exec(`DELETE FROM purchase WHERE uuid = HUID('${puid}');`);

    const purchases = await db.exec(`SELECT * FROM purchase WHERE uuid = HUID('${puid}');`);
    expect(purchases).to.have.length(0);
    const items = await db.exec(`SELECT * FROM purchase_item WHERE purchase_uuid = HUID('${puid}');`);
    expect(items).to.have.length(0);
  });

});
