/**
* TODO
*
* I would like to have a breakdown of usage by service.  How do I do this?
* What is the best HTTP API for this sort of complex linked data?
*
* It is meant to be a high-level API to data about inventory data.
*
* As per REST conventions, the routes with a UUID return a single
* JSON instance or 404 NOT FOUND.  The others return an array of
* results.
*
* TODO: We should migrate the inventory to using the regular bhima guidelines.
*/
const _ = require('lodash');
const core = require('./inventory/core');
const groups = require('./inventory/groups');
const types = require('./inventory/types');
const units = require('./inventory/units');
const importing = require('./import');
const util = require('../../lib/util');
const db = require('../../lib/db');
const {
  FROM_PURCHASE,
  FROM_INTEGRATION,
} = require('../../config/constants').flux;

const xlsx = require('../../lib/renderers/xlsx');
const ReportManager = require('../../lib/ReportManager');

// exposed routes
exports.createInventoryItems = createInventoryItems;
exports.updateInventoryItems = updateInventoryItems;
exports.getInventoryItems = getInventoryItems;
exports.getInventoryItemsById = getInventoryItemsById;

// expose inventory group methods
exports.createInventoryGroups = createInventoryGroups;
exports.updateInventoryGroups = updateInventoryGroups;
exports.listInventoryGroups = listInventoryGroups;
exports.detailsInventoryGroups = detailsInventoryGroups;
exports.deleteInventoryGroups = deleteInventoryGroups;
exports.countInventoryGroups = countInventoryGroups;

// expose inventory types methods
exports.createInventoryTypes = createInventoryTypes;
exports.updateInventoryTypes = updateInventoryTypes;
exports.listInventoryTypes = listInventoryTypes;
exports.detailsInventoryTypes = detailsInventoryTypes;
exports.deleteInventoryTypes = deleteInventoryTypes;

// expose inventory units methods
exports.createInventoryUnits = createInventoryUnits;
exports.updateInventoryUnits = updateInventoryUnits;
exports.listInventoryUnits = listInventoryUnits;
exports.detailsInventoryUnits = detailsInventoryUnits;
exports.deleteInventoryUnits = deleteInventoryUnits;

exports.deleteInventory = deleteInventory;

exports.getInventoryUnitCosts = getInventoryUnitCosts;

// expose routes for import
exports.importing = importing;

exports.logs = inventoryLog;
exports.wac = getInventoryWac;
exports.computeWac = computeWac;
exports.logDownLoad = logDownLoad;

// ======================= inventory metadata =============================
/**
 * POST /inventory/metadata
 * Create a new inventory data entry
 */
function createInventoryItems(req, res) {
  core.createItemsMetadata(req.body, req.session)
    .then((identifier) => {
      res.status(201).json({ uuid : identifier });
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });
}

/**
 * PUT /inventory/:uuid/metadata
 * Update an inventory data entry
 */
function updateInventoryItems(req, res) {
  core.updateItemsMetadata(req.body, req.params.uuid, req.session)
    .then((metadata) => {
      res.status(200).json(metadata);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });
}

async function inventoryLog(req, res) {
  const logs = await core.inventoryLog(req.params.uuid);
  res.status(200).json(logs);
}

/**
 * return inventory WAC from stock_value table
 */
async function getInventoryWac(req, res) {
  const data = await computeWac(req.params.uuid);
  res.status(200).json(data);
}

async function computeWac(inventoryUuid) {
  const binaryInventoryUuid = db.bid(inventoryUuid);

  const queryRecompute = `CALL ComputeInventoryStockValue(?, COALESCE(?, CURRENT_DATE()));`;

  const querySelect = `
    SELECT
      BUID(sv.inventory_uuid) inventory_uuid,
      i.text, sv.date, sv.quantity, sv.wac
    FROM stock_value sv
      JOIN inventory i ON i.uuid = sv.inventory_uuid
    WHERE sv.inventory_uuid = ?;
  `;

  await db.exec(queryRecompute, [binaryInventoryUuid, new Date()]);
  const data = await db.exec(querySelect, [binaryInventoryUuid]);
  return data[0];
}

// get inventory log as excel
// GET /inventory/download/log/:uuid?rendere=xlsx?lang=fr
async function logDownLoad(req, res) {
  const { lang } = req.query;
  const rows = await core.inventoryLog(req.params.uuid);
  // inventory columns

  const dictionary = util.loadDictionary(lang);

  const inventory = await core.getItemsMetadata({ uuid : req.params.uuid });

  const lines = [
    { column1 : '', column2 : '', column3 : '' },
  ];

  lines.push({
    column1 : _.get(dictionary, 'FORM.LABELS.INVENTORY'),
    column2 : inventory[0].label || '',
    column3 : '',
  });

  lines.push({ column1 : '', column2 : '', column3 : '' });
  rows.forEach(r => {
    const text = JSON.parse(r.text);
    lines.push({
      column1 : _.get(dictionary, 'FORM.LABELS.USER'),
      column2 : _.get(dictionary, 'FORM.LABELS.DATE'),
      column3 : '',
    });

    lines.push({ column1 : r.userName, column2 : r.log_timestamp, column3 : '' });

    lines.push({
      column1 : '',
      column2 : _.get(dictionary, 'FORM.LABELS.FROM'),
      column3 : _.get(dictionary, 'FORM.LABELS.TO'),
    });

    const currentchanges = Object.keys(text.current);
    currentchanges.forEach(cc => {
      const line2 = {
        column1 : _.get(dictionary, core.inventoryColsMap[cc]),
        column2 : text.last[cc],
        column3 : text.current[cc],
      };
      lines.push(line2);
    });

    lines.push({ column1 : '', column2 : '', column3 : '' });
  });

  const options = {
    csvKey : 'rows',
    suppressDefaultFormatting : true,
    suppressDefaultFiltering : true,
    renderer : 'xlsx',
    filename : 'FORM.LABELS.CHANGES',
  };

  const report = new ReportManager('', req.session, options);
  const result = await report.render({ rows : lines }, null, { lang });
  res.set(xlsx.headers).send(result.report);
}

/**
  * GET /inventory/metadata/
  * Returns a description all inventory items in the inventory table.
  * Returns a description the inventory items filter by params.
  *
  * @function searchInventoryItems
*/
async function getInventoryItems(req, res) {
  const params = req.query;

  try {
    const itemsMetadata = await core.getItemsMetadata(params);

    const queryTags = `
      SELECT BUID(t.uuid) uuid, t.name, t.color, BUID(it.inventory_uuid) inventory_uuid
      FROM tags t
        JOIN inventory_tag it ON it.tag_uuid = t.uuid
      WHERE it.inventory_uuid IN (?)
    `;

    // if we have an empty set, do not query tags.
    const dataRows = params.paging ? itemsMetadata.rows : itemsMetadata;
    if (dataRows.length !== 0 && !params.skipTags) {
      const inventoryUuids = dataRows.map(row => db.bid(row.uuid));
      const tags = await db.exec(queryTags, [inventoryUuids]);

      // make a inventory_uuid -> tags map.
      const tagMap = _.groupBy(tags, 'inventory_uuid');

      dataRows.forEach(inventory => {
        inventory.tags = tagMap[inventory.uuid] || [];
      });
    }

    if (params.paging) {
      res.status(200).json({ rows : dataRows, pager : itemsMetadata.pager });
    } else {
      res.status(200).json(dataRows);
    }
  } catch (error) {
    core.errorHandler(error, req, res);
  }
}

/**
* GET /inventory/metadata/:uuid
* Returns a description of the item from the inventory table.
*
* @function getInventoryItemsById
*/
function getInventoryItemsById(req, res) {
  const { uuid } = req.params;

  core.getItemsMetadataById(uuid, req.query)
    .then((row) => {
      res.status(200).json(row);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });
}

/**
* GET /inventory/:uuid/unit_cost
* Returns a list of unit purchase costs for this inventory item
*
* @function getInventoryUnitCosts
*/
function getInventoryUnitCosts(req, res) {
  try {
    const { uuid } = req.params;

    const costListQuery = `
      SELECT
        sm.unit_cost, sm.quantity, sm.date, sm.flux_id
      FROM stock_movement sm
      JOIN lot l ON l.uuid = sm.lot_uuid
      JOIN inventory inv ON inv.uuid = l.inventory_uuid
      WHERE l.inventory_uuid = ?
      AND sm.is_exit = 0
      AND sm.flux_id IN (${FROM_PURCHASE}, ${FROM_INTEGRATION})
      ORDER BY sm.date;
    `;

    const costStatsQuery = `
      SELECT
        AVG(sm.unit_cost) AS avg_unit_cost,
        MIN(sm.unit_cost) AS min_price,
        MAX(sm.unit_cost) AS max_price,
        COUNT(*) AS num_entries
      FROM stock_movement sm
      JOIN lot l ON l.uuid = sm.lot_uuid
      JOIN inventory inv ON inv.uuid = l.inventory_uuid
      WHERE l.inventory_uuid = ?
        AND sm.is_exit = 0
        AND sm.flux_id IN (${FROM_PURCHASE}, ${FROM_INTEGRATION})
      ORDER BY sm.date;
    `;

    Promise.all([
      db.exec(costListQuery, [db.bid(uuid)]),
      db.one(costStatsQuery, [db.bid(uuid)]),
    ])
      .then(([costs, stats]) => {
        // Compute the median unit cost
        const unitCosts = costs.map(item => Number(item.unit_cost));
        stats.median_unit_cost = util.median(unitCosts);

        const data = { costs, stats };
        res.status(200).json(data);
      });
  } catch (error) {
    core.errorHandler(error, req, res);
  }
}

/**
 * DELETE /inventory/metadata/:uuid
 *
 * @description
 * Delete an inventory item from the database
 */
async function deleteInventory(req, res) {
  try {
    await core.remove(req.params.uuid);
    res.sendStatus(204);
  } catch (err) {
    core.errorHandler(err, req, res);
  }
}

// ======================= inventory group =============================

/**
 * POST /inventory/groups
 * Create a new inventory group
 */
function createInventoryGroups(req, res) {
  groups.create(req.body)
    .then((identifier) => {
      res.status(201).json({ uuid : identifier });
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * PUT /inventory/groups/:uuid
 * Create a new inventory group
 */
function updateInventoryGroups(req, res) {
  groups.update(req.body, req.params.uuid)
    .then((rows) => {
      res.status(201).json(rows);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * GET /inventory/groups
 * get the list of inventory groups
 */
function listInventoryGroups(req, res) {
  groups.list(req.query.include_members)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * GET /inventory/groups/:uuid
 * get the list of inventory groups
 */
function detailsInventoryGroups(req, res) {
  groups.details(req.params.uuid)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * DELETE /inventory/groups/:uuid
 * delete an inventory group
 */
function deleteInventoryGroups(req, res) {
  groups.remove(req.params.uuid)
    .then(() => {
      res.sendStatus(204);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * GET /inventory/groups/:uuid/count
 * count inventory in the group
 */
function countInventoryGroups(req, res) {
  groups.countInventory(req.params.uuid)
    .then((rows) => {
      res.status(200).json(rows[0].inventory_counted);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

// ======================= inventory type =============================
/**
 * POST /inventory/types
 * Create a new inventory types
 */
function createInventoryTypes(req, res) {
  types.create(req.body)
    .then((id) => {
      res.status(201).json({ id });
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * PUT /inventory/types/:id
 * Create a new inventory types
 */
function updateInventoryTypes(req, res) {
  types.update(req.body, req.params.id)
    .then((rows) => {
      res.status(201).json(rows);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * GET /inventory/types
 * get the list of inventory types
 */
function listInventoryTypes(req, res) {
  types.list()
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * GET /inventory/types/:id
 * get the list of inventory types
 */
function detailsInventoryTypes(req, res) {
  types.details(req.params.id)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * DELETE /inventory/types/:id
 * delete an inventory types
 */
function deleteInventoryTypes(req, res) {
  types.remove(req.params.id)
    .then(() => {
      res.sendStatus(204);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

// ======================= inventory unit =============================
/**
 * POST /inventory/units
 * Create a new inventory units
 */
function createInventoryUnits(req, res) {
  units.create(req.body)
    .then((id) => {
      res.status(201).json({ id });
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * PUT /inventory/units/:id
 * Create a new inventory units
 */
function updateInventoryUnits(req, res) {
  units.update(req.body, req.params.id)
    .then((result) => {
      res.status(201).json(result);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}

/**
 * GET /inventory/units
 * get the list of inventory units
 */
function listInventoryUnits(req, res) {
  units.list()
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((error) => { core.errorHandler(error, req, res); });

}

/**
 * GET /inventory/units/:id
 * get the list of inventory units
 */
function detailsInventoryUnits(req, res) {
  units.details(req.params.id)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((error) => { core.errorHandler(error, req, res); });

}

/**
 * DELETE /inventory/units/:id
 * delete an inventory unit
 */
function deleteInventoryUnits(req, res) {
  units.remove(req.params.id)
    .then(() => {
      res.sendStatus(204);
    })
    .catch((error) => {
      core.errorHandler(error, req, res);
    });

}
