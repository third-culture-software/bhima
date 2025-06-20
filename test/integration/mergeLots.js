/* global expect, agent */

const moment = require('moment');
const helpers = require('./helpers');
const db = require('../../server/lib/db');

const preTestInfo = [
  { table : 'lot', count : 0 },
  { table : 'tags', count : 0 },
  { table : 'lot_tag', count : 0 },
  { table : 'stock_movement', count : 0 },
];
const tagsPreTest = preTestInfo[1];
const lotTagsPreTest = preTestInfo[2];
const stockMovementsPreTest = preTestInfo[3];

const depotUuid = 'F9CAEB16168443C5A6C447DBAC1DF296';

// Inventory UUID for: Vitamines B1+B6+B12, 100+50+0.5mg/2ml
const vitamineUuid = 'F6556E729D0547998CBD0A03B1810185';

// Define needed UUIDs and labels
const lot1Uuid = helpers.uuid();
const lot2Uuid = helpers.uuid();
const lot3Uuid = helpers.uuid();
const lot4Uuid = helpers.uuid();
const lot5Uuid = helpers.uuid();

const lot1Label = 'Test lot 1';
const lot2Label = 'Test lot 2';
const lot3Label = 'Test Lot 1';
const lot4Label = 'Test Lot 1';
const lot5Label = 'Test Lot 1';

const mockLots = [
  // uuid, label, inventory_uuid
  [lot1Uuid, lot1Label, vitamineUuid],
  [lot2Uuid, lot2Label, vitamineUuid],
  [lot3Uuid, lot3Label, vitamineUuid], // This is a dupe of the first lot
  [lot4Uuid, lot4Label, vitamineUuid], // This is another dupe of the first lot
  [lot5Uuid, lot5Label, vitamineUuid], // This is another dupe of the first lot
];

const tag3Uuid = helpers.uuid();
const tag4Uuid = helpers.uuid();
const tag5Uuid = helpers.uuid();

const mockTags = [
  // uuid, lot uuid, tag text
  [helpers.uuid(), lot1Uuid, 'XYZ Brand'],
  [helpers.uuid(), lot1Uuid, 'Vitamin'],
  [helpers.uuid(), lot2Uuid, 'Partial'],
  [tag3Uuid, lot3Uuid, 'Vitamin2'],
  [tag4Uuid, lot4Uuid, 'Vitamin3'],
  [tag5Uuid, lot5Uuid, 'Vitamin4'],
];

const stockMovement1Uuid = helpers.uuid();

const mockStockMovements = [
  // stockMovementUuid, lotUuid, quantity, unit_cost, is_exit, user_id, created_at, period_id
  [stockMovement1Uuid, lot3Uuid, 500 - 321, 1.2, 1, 1,
    moment().subtract(6, 'month').format('YYYY-MM-DD'),
    moment().subtract(6, 'month').format('YYYYMM'),
  ],
];

function addLotSQL(params) {
  const [lotUuid, label, inventoryUuid] = params;
  const expDate = moment().add(1, 'year').format('YYYY-MM-DD');
  return 'INSERT INTO lot (uuid, label, inventory_uuid, quantity, '
    + ' unit_cost, expiration_date) '
    + `VALUES (0x${lotUuid}, '${label}', 0x${inventoryUuid}, 321, `
    + `  1.2, '${expDate}');`;
}

function addTagSQL(params) {
  const [tagUuid, /* lotUuid */, tagLabel] = params;
  return 'INSERT INTO tags (uuid, name) '
    + `VALUES (0x${tagUuid}, '${tagLabel}');`;
}

function addLotTagSQL(params) {
  const [tagUuid, lotUuid] = params;
  return 'INSERT INTO lot_tag (lot_uuid, tag_uuid) '
    + `VALUES (0x${lotUuid}, 0x${tagUuid});`;
}

function addStockMovementSQL(params) {
  const [smUuid, lotUuid, quantity, unitCost, isExit, userId, createdAt, periodId] = params;
  return 'INSERT INTO stock_movement (uuid, document_uuid, depot_uuid, lot_uuid, quantity, unit_cost, '
    + '  date, is_exit, user_id, flux_id, created_at, period_id) '
    + `VALUES (0x${smUuid}, 0x${helpers.uuid()}, 0x${depotUuid}, 0x${lotUuid}, ${quantity}, ${unitCost}, `
    + `  '${createdAt}', ${isExit}, ${userId}, 9, '${createdAt}', '${periodId}');`;
}

describe('test/integration/mergeLots Test merging lots', () => {

  before('Note original counts of lots, tags, etc', () => {
    return preTestInfo.reduce((chain, item) => {
      return chain
        .then(() => db.exec(`SELECT * FROM ${item.table}`)
          .then(res => {
            item.count = res.length;
          }));
    }, Promise.resolve());
  });

  before('add mock lots', () => {
    return mockLots.reduce((chain, p) => {
      return chain
        .then(() => db.exec(addLotSQL(p)));
    }, Promise.resolve());
  });

  before('add mock lot tags', () => {
    return mockTags.reduce((chain, p) => {
      return chain
        .then(() => db.exec(addTagSQL(p)))
        .then(() => db.exec(addLotTagSQL(p)));
    }, Promise.resolve());
  });

  before('add mock stock movements', () => {
    return mockStockMovements.reduce((chain, p) => {
      return chain
        .then(() => db.exec(addStockMovementSQL(p)));
    }, Promise.resolve());
  });

  it(`Added temporary mock lots, tags, lot tags, and stock movements`, () => {});

  // ===========================================================================
  // Verify we have created the lots, tags, etc
  it('Verify we created lot1 and its dupes (lot3, lot4, lot5)', () => {
    return agent.get('/lots_dupes')
      .query({ label : lot1Label, inventory_uuid : vitamineUuid })
      .then((res) => {
        helpers.api.listed(res, 4); // 4 = the lot itself and 3 dupes
      })
      .catch(helpers.handler);
  });
  it('Verify we created lot2', () => {
    return agent.get('/lots_dupes')
      .query({ label : lot2Label, inventory_uuid : vitamineUuid })
      .then((res) => {
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });
  it(`Verify we created ${mockTags.length - tagsPreTest.count} tags`, () => {
    return agent.get('/tags')
      .then((res) => {
        helpers.api.listed(res, mockTags.length + tagsPreTest.count);
      })
      .catch(helpers.handler);
  });
  it(`Verify we created ${mockTags.length - lotTagsPreTest.count} lot tags`, () => {
    return db.exec('SELECT * from lot_tag')
      .then((res) => {
        expect(res.length).to.equal(mockTags.length + lotTagsPreTest.count);
      })
      .catch(helpers.handler);
  });
  it(`Verify we created ${mockStockMovements.length - stockMovementsPreTest.count} stock movements`, () => {
    return db.exec('SELECT * from stock_movement')
      .then((res) => {
        expect(res.length).to.equal(mockStockMovements.length + stockMovementsPreTest.count);
      })
      .catch(helpers.handler);
  });

  it(`Verify the 'find all duplicate lots' query works`, () => {
    return agent.get('/lots_all_dupes')
      .then((res) => {
        helpers.api.listed(res, 1); // all dupes can be merged into one
      })
      .catch(helpers.handler);
  });

  // ===========================================================================
  // NOW do the merge tests

  it('Merge lot 3 with lot 1 (single lot)', async () => {
    let res = await agent.post(`/lots/${lot1Uuid}/merge`)
      .send({ lotsToMerge : [lot3Uuid] });
    expect(res).to.have.status(200);

    res = await db.exec(`SELECT uuid from lot WHERE uuid = 0x${lot3Uuid}`);
    expect(res.length).to.equal(0,
      'Verify lot3 no longer exists');

    res = await db.exec(`SELECT HEX(lot_uuid) as lot_uuid from lot_tag WHERE tag_uuid = 0x${tag3Uuid}`);
    expect(res.length).to.equal(1);
    expect(res[0].lot_uuid).to.equal(lot1Uuid,
      'Verify that tag3 now refers to lot1');

    res = await db.exec(`SELECT HEX(lot_uuid) as lot_uuid from stock_movement WHERE uuid = 0x${stockMovement1Uuid}`);
    expect(res.length).to.equal(1);
    expect(res[0].lot_uuid).to.equal(lot1Uuid,
      'Verify that the stock movement now refers to lot1');
  });

  // ---------------------------------------------------------------------------

  it('Merge lots 4 and 5 with lot 1 (multiple lots)', async () => {
    let res = await agent.post(`/lots/${lot1Uuid}/merge`)
      .send({ lotsToMerge : [lot4Uuid, lot5Uuid] });
    expect(res).to.have.status(200);

    res = await db.exec(`SELECT * from lot WHERE uuid IN (0x${lot4Uuid}, 0x${lot5Uuid})`);
    expect(res.length).to.equal(0, 'Verify lots 4 and 5 no longer exist');

    res = await db.exec(`SELECT HEX(lot_uuid) as lot_uuid from lot_tag WHERE tag_uuid = 0x${tag4Uuid}`);
    expect(res.length).to.equal(1);
    expect(res[0].lot_uuid).to.equal(lot1Uuid, 'Verify that tag4 now points to lot1');

    res = await db.exec(`SELECT HEX(lot_uuid) as lot_uuid from lot_tag WHERE tag_uuid = 0x${tag5Uuid}`);
    expect(res.length).to.equal(1);
    expect(res[0].lot_uuid).to.equal(lot1Uuid, 'Verify that tag5 now points to lot1');
  });

  // ===========================================================================
  // Cleanup

  it(`Deleting all temporary mock lots, tags, lot tags, and stock movements`, () => {});

  after('Delete temporary tags and lot tags', () => {
    const tagUuids = mockTags.map(tag => db.bid(tag[0]));
    const lotUuids = mockTags.map(tag => db.bid(tag[1]));
    return db.exec('DELETE FROM lot_tag WHERE lot_uuid IN (?)', [lotUuids])
      .then(() => {
        return db.exec('DELETE FROM tags WHERE uuid IN (?)', [tagUuids]);
      });
  });

  after('Delete temporary stock movements', () => {
    const smUuids = mockStockMovements.map(smov => db.bid(smov[0]));
    return db.exec('DELETE FROM stock_movement WHERE uuid IN (?)', [smUuids]);
  });

  after('Delete temporary lots', () => {
    const lotUuids = mockLots.map(lot => db.bid(lot[0]));
    return db.exec(`DELETE FROM lot WHERE uuid IN (?);`, [lotUuids]);
  });

  after('Verify we have deleted all temporary lots, tags, etc', () => {
    return preTestInfo.reduce((chain, item) => {
      return chain
        .then(() => db.exec(`SELECT * FROM ${item.table}`)
          .then(res => {
            expect(res.length).to.equal(item.count,
              `Verify deletion of temporary '${item.table}' rows`);
          }));
    }, Promise.resolve());
  });

});
