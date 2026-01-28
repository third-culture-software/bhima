 
/**
 * @module stock
 * @description
 * The /stock HTTP API endpoint
 *
 * This module is responsible for handling all crud operations relatives to stocks
 * and define all stock API functions
 * @requires lodash
 * @requires lib/uuid
 * @requires lib/db
 * @requires stock/core
 */
const _ = require('lodash');
const moment = require('moment');

const { uuid } = require('../../lib/util');
const db = require('../../lib/db');
const { BadRequest, Unauthorized } = require('../../lib/errors');
const { DELETE_STOCK_MOVEMENT } = require('../../config/constants').actions;

const core = require('./core');
const importing = require('./import');
const assign = require('./assign');
const shipment = require('../asset_management/shipment');
const requisition = require('./requisition/requisition');
const requestorType = require('./requisition/requestor_type');
const Fiscal = require('../finance/fiscal');
const vouchers = require('../finance/vouchers');
const depots = require('../inventory/depots');

// expose to the API
exports.createStock = createStock;
exports.createMovement = createMovement;
exports.deleteMovement = deleteMovement;
exports.listAssetLots = listAssetLots;
exports.listLots = listLots;
exports.listLotsDepot = listLotsDepot;
exports.listLotsDepotDetailed = listLotsDepotDetailed;
exports.listInventoryDepot = listInventoryDepot;
exports.listLotsMovements = listLotsMovements;
exports.listMovements = listMovements;
exports.listStockFlux = listStockFlux;
exports.createIntegration = createIntegration;
exports.importing = importing;
exports.assign = assign;
exports.requisition = requisition;
exports.requestorType = requestorType;
exports.createInventoryAdjustment = createInventoryAdjustment;

exports.listStatus = core.listStatus;
// stock consumption
exports.getStockConsumption = getStockConsumption;
exports.getStockConsumptionAverage = getStockConsumptionAverage;

// stock transfers
exports.getStockTransfers = getStockTransfers;

// stock dashboard
exports.dashboard = dashboard;

/**
 * POST /stock/lots
 * Create a new stock lots entry
 * @param req
 * @param res
 */
async function createStock(req, res) {
  const params = req.body;
  const documentUuid = uuid();

  const period = await Fiscal.lookupFiscalYearByDate(params.date);
  const periodId = period.id;

  const transaction = db.transaction();
  const document = {
    uuid : documentUuid,
    date : new Date(params.date),
    user : req.session.user.id,
    depot_uuid : params.depot_uuid,
    flux_id : params.flux_id,
    description : params.description,
    reference_number : params.reference_number,
    serial_number : params.serial_number,
  };

  // prepare lot insertion query
  const createLotQuery = 'INSERT INTO lot SET ?';

  // prepare movement insertion query
  const createMovementQuery = 'INSERT INTO stock_movement SET ?';

  params.lots.forEach(lot => {

    let lotUuid = lot.uuid;

    if (lotUuid === null || typeof lotUuid === 'undefined') {
      // Create new lot (if one it does not already exist)
      lotUuid = uuid();

      // parse the dates
      const date = new Date(lot.expiration_date);
      const acquitionDate = new Date(lot.acquisition_date);

      // the lot object to insert
      const createLotObject = {
        uuid : db.bid(lotUuid),
        label : lot.label,
        quantity : lot.quantity,
        unit_cost : lot.unit_cost,
        description : lot.description,
        expiration_date : date,
        inventory_uuid : db.bid(lot.inventory_uuid),
        reference_number : lot.reference_number,
        serial_number : lot.serial_number,
        acquisition_date : acquitionDate || null,
        package_size : lot.package_size || 1,
        funding_source_uuid : lot.funding_source_uuid ? db.bid(lot.funding_source_uuid) : null,
      };

      // adding a lot insertion query into the transaction
      transaction.addQuery(createLotQuery, [createLotObject]);
    }

    // the movement object to insert
    const createMovementObject = {
      uuid : db.bid(uuid()),
      lot_uuid : db.bid(lotUuid),
      depot_uuid : db.bid(document.depot_uuid),
      document_uuid : db.bid(documentUuid),
      flux_id : params.flux_id,
      date : document.date,
      quantity : lot.quantity,
      unit_cost : lot.unit_cost,
      is_exit : 0,
      user_id : document.user,
      description : document.description,
      period_id : periodId,
    };

    if (params.entity_uuid) {
      createMovementObject.entity_uuid = db.bid(params.entity_uuid);
    }

    // adding a movement insertion query into the transaction
    transaction.addQuery(createMovementQuery, [createMovementObject]);
  });

  const isExit = 0;
  const postingParams = [db.bid(documentUuid), isExit, req.session.project.id];

  if (req.session.stock_settings.enable_auto_stock_accounting) {
    transaction.addQuery('CALL PostStockMovement(?)', [postingParams]);
  }

  // gather unique inventory uuids for use later recomputing the stock quantities
  const inventoryUuids = params.lots
    .map(lot => lot.inventory_uuid)
    .filter((uid, index, array) => array.lastIndexOf(uid) === index);

  // if we are adding stock, we must update the weighted average cost
  if (!isExit && params.flux_id !== core.flux.FROM_OTHER_DEPOT) {
    inventoryUuids.forEach(uid => {
      transaction.addQuery('CALL StageInventoryForStockValue(?);', [db.bid(uid)]);
    });

    transaction.addQuery('CALL RecomputeStockValueForStagedInventory(NULL);');
  }

  // execute all operations as one transaction
  await transaction.execute();

  // update the quantity in stock as needed
  await updateQuantityInStockAfterMovement(inventoryUuids, params.date, document.depot_uuid);

  res.status(201).json({ uuid : documentUuid });
}

/**
 * @param inventoryUuids
 * @param mvmtDate
 * @param depotUuid
 * @function updateQuantityInStockAfterMovement
 * @description
 * This function is called after each stock movement to ensure that the quantity in stock is updated in
 * the stock_movement_status table.  It takes in an array of inventory uuids, the date, and the depot's
 * identifier.  To reduce churn, it first filers out duplicate inventory uuids before calling the stored
 * procedure.
 */
function updateQuantityInStockAfterMovement(inventoryUuids, mvmtDate, depotUuid) {
  const txn = db.transaction();

  // loop through the inventory uuids, queuing up them to rerun
  inventoryUuids.forEach(uid => {
    txn.addQuery(`CALL StageInventoryForAMC(?)`, [db.bid(uid)]);
  });

  txn.addQuery(`CALL ComputeStockStatusForStagedInventory(DATE(?), ?)`, [
    new Date(mvmtDate),
    db.bid(depotUuid),
  ]);

  return txn.execute();
}

/**
 * @function insertNewStock
 * @param {object} session The session object
 * @param {object} params Request body params (req.body)
 */
async function insertNewStock(session, params) {
  const transaction = db.transaction();
  const documentUuid = uuid();

  const period = await Fiscal.lookupFiscalYearByDate(params.movement.date);
  const periodId = period.id;

  params.lots.forEach((lot) => {
    let lotUuid = lot.uuid;

    if (lotUuid === null) {
      // adding a lot insertion query into the transaction
      // (this is necessary only if we are creating a new lot)
      lotUuid = uuid();
      transaction.addQuery(`INSERT INTO lot SET ?`, {
        uuid : db.bid(lotUuid),
        label : lot.label,
        quantity : lot.quantity,
        unit_cost : lot.unit_cost,
        description : lot.description,
        expiration_date : new Date(lot.expiration_date),
        acquisition_date : lot.acquisition_date ? new Date(lot.acquisition_date) : null,
        inventory_uuid : db.bid(lot.inventory_uuid),
        serial_number : lot.serial_number,
        package_size : lot.package_size || 1,
        funding_source_uuid : lot.funding_source_uuid ? db.bid(lot.funding_source_uuid) : null,
      });
    }

    // adding a movement insertion query into the transaction
    transaction.addQuery(`INSERT INTO stock_movement SET ?`, {
      uuid : db.bid(uuid()),
      lot_uuid : db.bid(lotUuid),
      depot_uuid : db.bid(params.movement.depot_uuid),
      document_uuid : db.bid(documentUuid),
      flux_id : params.movement.flux_id,
      date : new Date(params.movement.date),
      quantity : lot.quantity,
      unit_cost : lot.unit_cost,
      is_exit : 0,
      user_id : params.movement.user_id,
      description : params.movement.description,
      period_id : periodId,
    });
  });

  // gather inventory uuids for use later recomputing the stock quantities
  const inventoryUuids = params.lots.map(lot => lot.inventory_uuid);

  const postingParams = [
    db.bid(documentUuid), 0, session.project.id,
  ];

  if (session.stock_settings.enable_auto_stock_accounting) {
    transaction.addQuery('CALL PostStockMovement(?)', [postingParams]);
  }

  transaction.addQuery('CALL RecomputeStockValue(NULL);');

  await transaction.execute();
  // update the quantity in stock as needed
  await updateQuantityInStockAfterMovement(inventoryUuids, params.movement.date, params.movement.depot_uuid);
  return documentUuid;
}

/**
 * POST /stock/integration
 * create a new integration entry
 * @param req
 * @param res
 */
async function createIntegration(req, res) {
  const documentUuid = await insertNewStock(req.session, req.body);
  res.status(201).json({ uuid : documentUuid });
}

/**
 * POST /stock/inventory_adjustment
 * Stock inventory adjustment
 * @param req
 * @param res
 */
async function createInventoryAdjustment(req, res) {
  let movement = req.body;
  const isMobileSync = movement.sync_mobile;

  if (isMobileSync === 1) {
    movement = await movementsFromMobile(movement);
  }
  let filteredInvalidData = [];

  const paramsStock = {
    dateTo : new Date(),
    depot_uuid : movement.depot_uuid,
    includeEmptyLot : 0,
    month_average_consumption : req.session.stock_settings.month_average_consumption,
    average_consumption_algo : req.session.stock_settings.average_consumption_algo,
  };

  const stockAvailable = await core.getLotsDepot(null, paramsStock);

  if (!movement.depot_uuid) {
    throw new Error('No defined depot');
  }

  // only consider lots that have changed.
  const lots = movement.lots
    .filter(l => l.quantity !== l.oldQuantity);

  const period = await Fiscal.lookupFiscalYearByDate(new Date(movement.date));
  const periodId = period.id;

  const trx = db.transaction();
  const uniqueAdjustmentUuid = uuid();

  let countNeedIncrease = 0;
  let countNeedDecrease = 0;

  lots.forEach(lot => {
    lot.quantityAvailable = 0;

    if (lot.oldQuantity > lot.quantity) {
      lot.isExit = 1;
      lot.outputQuantity = lot.oldQuantity - lot.quantity;

      if (stockAvailable) {
        stockAvailable.forEach(stock => {
          if (stock.uuid === lot.uuid) {
            lot.quantityAvailable = stock.quantity;
          }
        });
      }
    }
  });

  filteredInvalidData = await lots.filter(l => l.outputQuantity > l.quantityAvailable);

  if (filteredInvalidData.length) {
    throw new BadRequest(
      `This stock adjustement will overconsume the quantity in stock and generate negative quantity in stock`,
      `ERRORS.ER_PREVENT_NEGATIVE_QUANTITY_IN_ADJUSTMENT_STOCK`,
    );
  }

  // get unit costs from stock_value
  const inventoryUuids = lots.map(l => db.bid(l.inventory_uuid));
  const unitCosts = await db.exec(
    'SELECT BUID(inventory_uuid) as inventory_uuid, wac FROM stock_value WHERE inventory_uuid in (?);',
    [inventoryUuids]);

  const unitCostMap = new Map(unitCosts.map(cost => [cost.inventory_uuid, cost.wac]));

  lots.forEach(lot => {
    // adjust lot's unit cost with the wac cost of the inventory
    // so that the receipt will reflect the stock sheet paper
    lot.unit_cost = unitCostMap.get(lot.inventory_uuid);

    const difference = lot.quantity - lot.oldQuantity;

    const adjustmentMovement = {
      uuid : db.bid(uuid()),
      lot_uuid : db.bid(lot.uuid),
      depot_uuid : db.bid(movement.depot_uuid),
      document_uuid : db.bid(uniqueAdjustmentUuid),
      quantity : Math.abs(difference),
      unit_cost : lot.unit_cost,
      date : new Date(movement.date),
      entity_uuid : movement.entity_uuid,
      flux_id : core.flux.INVENTORY_ADJUSTMENT,
      description : movement.description,
      user_id : req.session.user.id,
      period_id : periodId,
    };

    const log = {
      movement_uuid : adjustmentMovement.uuid,
      old_quantity : lot.oldQuantity,
      new_quantity : lot.quantity,
    };

    if (difference < 0) {
      // we have to do a stock exit movement
      // we must subtract the |difference| to the current quantity
      countNeedDecrease++;
      adjustmentMovement.is_exit = 1;
    } else {
      // we must do increase the current quantity by the |difference|
      countNeedIncrease++;
      adjustmentMovement.is_exit = 0;
    }

    trx.addQuery('INSERT INTO stock_movement SET ?', adjustmentMovement);
    trx.addQuery('INSERT INTO stock_adjustment_log SET ?', log);
  });

  const decreaseParams = [
    db.bid(uniqueAdjustmentUuid), 1, req.session.project.id,
  ];

  const increaseParams = [
    db.bid(uniqueAdjustmentUuid), 0, req.session.project.id,
  ];

  if (req.session.stock_settings.enable_auto_stock_accounting) {
    if (countNeedDecrease > 0) {
      trx.addQuery('CALL PostStockMovement(?)', [decreaseParams]);
    }

    if (countNeedIncrease > 0) {
      trx.addQuery('CALL PostStockMovement(?)', [increaseParams]);
    }
  }

  trx.addQuery('CALL RecomputeStockValue(NULL);');

  // reset all previous lots
  await trx.execute();

  if (isMobileSync === 1) {
    const uuids = lots.map(l => l.uuid).join(',');
    return res.status(201)
      .json({
        uuid : uniqueAdjustmentUuid,
        date : new Date(movement.date),
        user : req.session.user.id,
        uuids,
      });
  }
  // await normalMovement(document, movement, req.session);
  return res.status(201)
    .json({
      uuid : uniqueAdjustmentUuid,
      date : new Date(movement.date),
      user : req.session.user.id,
    });
}

/**
 * Build a stock movement payload from data submitted by a mobile client.
 * @param {object} params - Parameters received from the mobile application.
 * @param {Array<object>} params.lots - List of lot movements provided by the mobile client.
 * @param {string} params.lots[].uuid - Unique identifier of the mobile lot line.
 * @param {string} params.lots[].lotUuid - UUID of the corresponding BHIMA lot.
 * @param {string} params.lots[].description - Description of the lot or movement line.
 * @param {number} params.lots[].quantity - Quantity moved for this lot.
 * @param {number} params.lots[].unitCost - Unit cost associated with the lot.
 * @param {boolean} params.lots[].isExit - Indicates whether the movement is an exit.
 * @param {string} [params.lots[].reference] - Reference linking this movement to an initial stock exit.
 * @param {string} params.lots[].depotUuid - UUID of the depot associated with the mobile movement.
 * @param {number} params.lots[].fluxId - Identifier of the stock flux type.
 * @param {string|Date} params.lots[].date - Date of the movement as provided by the mobile client.
 * @returns {object} A normalized stock movement object containing document/depot/lot information
 *   suitable for persistence, or an empty object if no valid lots are found.
 */
async function movementsFromMobile(params) {
  const mobileLots = params.lots;
  const [mobile] = mobileLots;
  const STOCK_EXIT_TO_DEPOT = 8;

  if (!mobile.isExit && mobile.reference) {

    // find the initial stock exit movement
    const findMovements = `
      SELECT 
        BUID(m.document_uuid) document_uuid,
        BUID(m.depot_uuid) depot_uuid,
        BUID(l.inventory_uuid) inventory_uuid,
        BUID(m.lot_uuid) lot_uuid,
        m.quantity
      FROM stock_movement m
      JOIN lot l ON l.uuid = m.lot_uuid
      WHERE m.entity_uuid = ? AND m.reference = ? AND m.is_exit = 1 AND m.flux_id = ?;
    `;
    const movements = await db.exec(findMovements, [
      db.bid(mobile.depotUuid), mobile.reference, STOCK_EXIT_TO_DEPOT,
    ]);

    const pickLot = lotUuid => movements.filter(item => item.lot_uuid === lotUuid)[0];

    // filter known lots of the movement initial movement
    // check that the quantity sent is less or equal to
    // the initial quantity
    const validLots = mobileLots.filter(lot => {
      const bhimaLot = pickLot(lot.lotUuid);
      return bhimaLot && bhimaLot.quantity >= lot.quantity;
    }).map(item => {
      const bhimaLot = pickLot(item.lotUuid);
      return {
        unique_line : item.uuid,
        uuid : item.lotUuid,
        inventory_uuid : bhimaLot.inventory_uuid,
        description : item.description,
        quantity : item.quantity,
        unit_cost : item.unitCost,
      };
    });

    const [bhima] = movements;
    return validLots.length ? {
      document_uuid : bhima.document_uuid,
      description : mobile.description,
      flux_id : mobile.fluxId,
      is_exit : mobile.isExit,
      depot_uuid : mobile.depotUuid,
      date : mobile.date,
      from_depot : bhima.depot_uuid,
      to_depot : mobile.depotUuid,
      lots : validLots,
    } : {};

  }

  if (!mobile.isExit && !mobile.reference) {
    // stock integration
    return {
      flux_id : mobile.fluxId,
      is_exit : mobile.isExit,
      depot_uuid : mobile.depotUuid,
      date : mobile.date,
      description : mobile.description,
      lots : mobileLots.map(item => {
        return {
          uuid : item.lotUuid,
          inventory_uuid : item.inventoryUuid,
          description : item.description,
          quantity : item.quantity,
          unit_cost : item.unitCost,
        };
      }),
    };
  }
  // stock adjustment
  if (mobile.isExit && mobile.fluxId === 15) {
    return mobileLots.length ? {
      flux_id : mobile.fluxId,
      is_exit : mobile.isExit,
      depot_uuid : mobile.depotUuid,
      entity_uuid : db.bid(mobile.depotUuid),
      date : mobile.date,
      description : mobile.description,
      lots : mobileLots.map(item => {
        return {
          unique_line : item.uuid,
          uuid : item.lotUuid,
          inventory_uuid : item.inventoryUuid,
          description : item.description,
          oldQuantity : item.oldQuantity,
          quantity : item.quantity,
          unit_cost : item.unitCost,
        };
      }),
    } : {};
  }
  // default stock exit movement
  return mobileLots.length ? {
    flux_id : mobile.fluxId,
    is_exit : mobile.isExit,
    depot_uuid : mobile.depotUuid,
    entity_uuid : mobile.depotUuid,
    date : mobile.date,
    description : mobile.description,
    lots : mobileLots.map(item => {
      return {
        unique_line : item.uuid,
        uuid : item.lotUuid,
        inventory_uuid : item.inventoryUuid,
        description : item.description,
        quantity : item.quantity,
        unit_cost : item.unitCost,
      };
    }),
  } : {};

}

/**
 * @param req
 * @param res
 * @function createMovement
 * @description
 * Create a new stock movement.
 *
 * POST /stock/lots/movement
 */
async function createMovement(req, res) {
  let params = req.body;
  const isMobileSync = params.sync_mobile;

  if (isMobileSync === 1) {
    params = await movementsFromMobile(params);
  }

  if (!params.lots || !params.lots.length) {
    throw new BadRequest('The stock movement is not valid');
  }

  const document = {
    uuid : params.document_uuid || uuid(),
    date : new Date(params.date),
    user : req.session.user.id,
    shipment_uuid : params.shipment_uuid,
  };

  const metadata = {
    project : req.session.project,
    enterprise : req.session.enterprise,
    stock_settings : req.session.stock_settings,
  };

  // when exit, we need to check that we are not accidentally over-consuming items
  if (params.is_exit) {
    // NOTE(@jniles) - we use _today's_ date because we want to know if this movement will
    // cause a negative value at any point in the future.
    const stockInDepot = await depots.getLotsInStockForDate(params.depot_uuid, new Date());

    // get a list of the lots that are being overconsumed
    // if the lot is in the depot, that means it was totally consumed at some point
    const overconsumed = params.lots.filter(lot => {
      const lotInDepot = stockInDepot.find(l => l.lot_uuid === lot.uuid);
      if (!lotInDepot) { return true; }
      return lot.quantity > lotInDepot.quantity;
    });

    // show a nicer error if the quantity in stock is overconsumed
    if (overconsumed.length) {
      const labels = overconsumed.map(l => l.label).join(', ').trim();
      throw new BadRequest(
        `This stock exit will overconsume the lots in stock and create negative quantity in stock for ${labels}.`,
        `ERRORS.ER_PREVENT_NEGATIVE_QUANTITY_IN_EXIT_STOCK`,
      );
    }
  }

  // get unit costs from stock_value
  const inventoryUuids = params.lots.map(l => db.bid(l.inventory_uuid));
  const unitCosts = await db.exec(
    'SELECT BUID(inventory_uuid) as inventory_uuid, wac FROM stock_value WHERE inventory_uuid in (?);',
    [inventoryUuids]);

  const unitCostMap = new Map(unitCosts.map(cost => [cost.inventory_uuid, cost.wac]));

  params.lots.forEach(lot => {
    lot.unit_cost = unitCostMap.get(lot.inventory_uuid);
  });

  // NOTE(@jniles) - the id here is the period id, not the fiscal year id.
  const periodId = (await Fiscal.lookupFiscalYearByDate(params.date)).id;
  params.period_id = periodId;

  const isDepotMovement = (params.from_depot && params.to_depot);
  const stockMovementFn = isDepotMovement ? depotMovement : normalMovement;
  await stockMovementFn(document, params, metadata);

  if (isMobileSync === 1) {
    const uuids = params.lots.map(l => l.uuid).join(',');
    return res.status(201).json({ uuid : document.uuid, uuids });
  }

  return res.status(201).json({ uuid : document.uuid });
}

/**
 * @param req
 * @param res
 * @function deleteMovement
 * @description perform a stock movement deletion based on its document uuid
 */
async function deleteMovement(req, res) {
  const tx = db.transaction();
  const identifier = db.bid(req.params.document_uuid);
  const stockSettings = req.session.stock_settings;

  // delete stock movement.
  const isUserAuthorized = req.session.actions.includes(DELETE_STOCK_MOVEMENT);

  if (!isUserAuthorized) {
    throw new Unauthorized(`User ${req.session.user.username} is not authorized to delete stock movements.`);
  }

  // movement details for future quantity update
  const movementDetailsQuery = `
      SELECT DISTINCT BUID(m.depot_uuid) AS depot_uuid, BUID(l.inventory_uuid) AS inventory_uuid,
        m.is_exit, m.date
      FROM stock_movement m
        JOIN lot l ON l.uuid = m.lot_uuid
      WHERE m.document_uuid = ?
    `;

  const movementDetails = await db.exec(movementDetailsQuery, [identifier]);

  // delete the movement(s)
  const movementDeletionQuery = `
      DELETE FROM stock_movement WHERE document_uuid = ?;
    `;

  tx.addQuery(movementDeletionQuery, [identifier]);

  const oldestDate = Math.min(...movementDetails.map(m => m.date));

  // delete lots from (purchase, donation and integration)
  const deleteLots = `
      DELETE FROM lot WHERE uuid IN (
        SELECT uuid FROM stock_movement WHERE document_uuid = ? AND flux_id IN (1, 6, 13)
      );
    `;

  tx.addQuery(deleteLots, [identifier]);

  tx.addQuery('CALL RecomputeStockValue(NULL);');

  // remove stock movements and related lots
  // by removing stock movements, only quantities are affected
  // accounting amounts are not touched in the next line
  await tx.execute();

  if (stockSettings.enable_auto_stock_accounting) {
    // find transaction's record_uuid from journal
    // safely delete voucher related to record_uuid found
    const findTransactionInJournal = `
        SELECT DISTINCT record_uuid FROM posting_journal WHERE reference_uuid = ?
      `;
    const records = await db.exec(findTransactionInJournal, [identifier]);
    const dbPromise = records.map(item => vouchers.safelyDeleteVoucher(item.record_uuid));
    await Promise.all(dbPromise);
  }

  // update the quantity of inventories
  const inventoriesByDepots = _.groupBy(movementDetails, 'depot_uuid');
  const inventoriesToUpdates = Object.keys(inventoriesByDepots).map(depot => {
    const inventories = inventoriesByDepots[depot].map(item => item.inventory_uuid);
    return updateQuantityInStockAfterMovement(inventories, new Date(oldestDate), depot);
  });

  await Promise.all(inventoriesToUpdates);

  res.sendStatus(204);
}

/**
 * @param document
 * @param params
 * @param metadata
 * @function normalMovement
 * @description there are only lines for IN or OUT
 */
async function normalMovement(document, params, metadata) {
  let createMovementQuery;
  let createMovementObject;

  const transaction = db.transaction();
  const parameters = params;

  parameters.entity_uuid = parameters.entity_uuid ? db.bid(parameters.entity_uuid) : null;
  parameters.invoice_uuid = parameters.invoice_uuid ? db.bid(parameters.invoice_uuid) : null;

  parameters.lots.forEach((lot) => {
    // Ignore duplicated value which can come from mobile during sync
    // MySQL will ignore duplicated values from mobile in case they are
    createMovementQuery = 'INSERT IGNORE INTO stock_movement SET ?';
    createMovementObject = {
      uuid : db.bid(lot.unique_line || uuid()),
      lot_uuid : db.bid(lot.uuid),
      depot_uuid : db.bid(parameters.depot_uuid),
      document_uuid : db.bid(document.uuid),
      quantity : lot.quantity,
      unit_cost : lot.unit_cost,
      date : document.date,
      entity_uuid : parameters.entity_uuid,
      is_exit : parameters.is_exit,
      flux_id : parameters.flux_id,
      description : parameters.description,
      user_id : document.user,
      invoice_uuid : parameters.invoice_uuid,
      period_id : parameters.period_id,
    };

    // transaction - add movement
    transaction.addQuery(createMovementQuery, [createMovementObject]);
  });

  // gather inventory uuids for later quantity in stock calculation updates
  const inventoryUuids = parameters.lots.map(lot => lot.inventory_uuid);

  const postStockParameters = [db.bid(document.uuid), parameters.is_exit, metadata.project.id];

  if (metadata.stock_settings.enable_auto_stock_accounting) {
    transaction.addQuery('CALL PostStockMovement(?, ?, ?);', postStockParameters);
  }

  // compute stock value after entry movements
  if (!parameters.is_exit) {
    transaction.addQuery('CALL RecomputeStockValue(NULL);');
  }
  const result = await transaction.execute();

  // update the quantity in stock as needed
  await updateQuantityInStockAfterMovement(inventoryUuids, document.date, parameters.depot_uuid);

  return result;
}

/**
 * @param document
 * @param params
 * @param metadata
 * @function depotMovement
 * @description movement between depots
 */
async function depotMovement(document, params, metadata) {
  const transaction = db.transaction();
  const parameters = params;
  const isExit = parameters.isExit ? 1 : 0;

  let record;

  parameters.entity_uuid = parameters.entity_uuid ? db.bid(parameters.entity_uuid) : null;

  const requistionUuid = parameters.stock_requisition_uuid;

  parameters.stock_requisition_uuid = parameters.stock_requisition_uuid
    ? db.bid(parameters.stock_requisition_uuid) : null;

  const depotUuid = isExit ? db.bid(parameters.from_depot) : db.bid(parameters.to_depot);
  const entityUuid = isExit ? db.bid(parameters.to_depot) : db.bid(parameters.from_depot);
  const fluxId = isExit ? core.flux.TO_OTHER_DEPOT : core.flux.FROM_OTHER_DEPOT;

  parameters.lots.forEach((lot) => {
    record = {
      depot_uuid : depotUuid,
      entity_uuid : entityUuid,
      is_exit : isExit,
      flux_id : fluxId,
      uuid : db.bid(lot.unique_line || uuid()),
      lot_uuid : db.bid(lot.uuid),
      document_uuid : db.bid(document.uuid),
      quantity : lot.quantity,
      unit_cost : lot.unit_cost,
      date : document.date,
      description : parameters.description,
      user_id : document.user,
      period_id : parameters.period_id,
      stock_requisition_uuid : parameters.stock_requisition_uuid,
    };
    // Ignore duplicated value which can come from mobile during sync
    // MySQL will ignore duplicated values from mobile in case they are
    transaction.addQuery('INSERT IGNORE INTO stock_movement SET ?', [record]);
  });

  if (isExit) {
    // write shipment for the exit movement
    await shipment.writeStockExitShipment(
      metadata.project.id, depotUuid, entityUuid, document, parameters, transaction,
    );
  }

  if (!isExit) {
    // update shipment details for the entry movement
    shipment.writeStockEntryShipment(document, parameters, transaction);
  }

  // gather inventory uuids for later quantity in stock calculation updates
  const inventoryUuids = parameters.lots.map(lot => lot.inventory_uuid);

  // TODO(@jniles) - we don't need to recompute stock value for depot movements
  // the value to the enterprise has not changed.
  // transaction.addQuery('CALL RecomputeStockValue(NULL);');

  const result = await transaction.execute();

  // update the quantity in stock as needed
  await updateQuantityInStockAfterMovement(inventoryUuids, document.date, depotUuid);

  // Update the requistion
  if (parameters.stock_requisition_uuid) {
    await requisition.updateStatus(requistionUuid);
  }

  if (!isExit) {
    await shipment.updateShipmentStatusAfterEntry(document);
  }

  return result;
}

/**
 * GET /stock/assetLots
 * Get the assets lots
 * @param req
 * @param res
 */
async function listAssetLots(req, res) {
  const params = req.query;
  const rows = await core.getAssets(params);
  res.status(200).json(rows);
}

/**
 * GET /stock/lots
 * this function helps to list lots
 * @param req
 * @param res
 */
async function listLots(req, res) {
  const params = req.query;
  const rows = await core.getLots(null, params);
  res.status(200).json(rows);
}

/**
 * GET /stock/lots/movements
 * returns list of stock movements
 * @param req
 * @param res
 */
async function listLotsMovements(req, res) {
  const rows = await core.getLotsMovements(null, req.query);
  res.status(200).json(rows);
}

/**
 * GET /stock/movements
 * returns list of stock movements
 * @param req
 * @param res
 */
async function listMovements(req, res) {
  const params = req.query;

  if (req.session.stock_settings.enable_strict_depot_permission) {
    params.check_user_id = req.session.user.id;
  }

  const rows = await core.getMovements(null, params);
  res.status(200).json(rows);
}

/**
 * GET /stock/dashboard
 * returns data for stock dashboard
 * @param req
 * @param res
 */
async function dashboard(req, res) {
   
  const { month_average_consumption, average_consumption_algo, min_delay, enable_expired_stock_out } = req.session.stock_settings;

  const dbPromises = [];
  let depotsByUser = [];

  const { status } = req.query;

  const getDepotsByUser = `
    SELECT DISTINCT BUID(dep.depot_uuid) AS depot_uuid, d.text AS depot_text
    FROM (
      SELECT dp.depot_uuid
      FROM depot_permission AS dp
      WHERE dp.user_id = ?
      UNION
      SELECT ds.depot_uuid
      FROM depot_supervision AS ds
      WHERE ds.user_id = ?
    ) AS dep
    JOIN depot AS d ON d.uuid = dep.depot_uuid
    ORDER BY d.text ASC;`;

  const _depots = await db.exec(getDepotsByUser, [req.session.user.id, req.session.user.id]);
  depotsByUser = _depots;

  _depots.forEach(depot => {
    if (status === 'expired') {
      const paramsFilter = {
        dateTo : new Date(),
        depot_uuid : depot.depot_uuid,
        includeEmptyLot : 0,
        is_expired : 1,
      };

      dbPromises.push(core.getInventoryQuantityAndConsumption(
        paramsFilter,
        month_average_consumption,
      ));
    } else if (status === 'out_of_stock') {
      // add the params for considered expired stock as being out of stock
      const paramsFilter = {
        dateTo : new Date(),
        depot_uuid : depot.depot_uuid,
        status : 'stock_out',
        enable_expired_stock_out,
        month_average_consumption,
        average_consumption_algo,
        min_delay,
      };

      dbPromises.push(core.getInventoryQuantityAndConsumption(
        paramsFilter,
        month_average_consumption,
      ));
    } else if (status === 'at_risk_expiration') {
      const paramsGetLots = {
        depot_uuid : depot.depot_uuid,
        period : 'allTime',
        includeEmptyLot : '0',
        is_expiry_risk : '1',
        month_average_consumption,
        average_consumption_algo,
        min_delay,
      };

      dbPromises.push(core.getLotsDepot(
        null,
        paramsGetLots,
      ));
    } else if (status === 'at_risk_out_stock') {
      const paramsFilter = {
        period : 'allTime',
        depot_uuid : depot.depot_uuid,
        includeEmptyLot : '0',
        status : 'security_reached',
      };

      dbPromises.push(core.getInventoryQuantityAndConsumption(
        paramsFilter,
        month_average_consumption,
        average_consumption_algo,
      ));
    } else if (status === 'over_max') {
      const paramsFilter = {
        period : 'allTime',
        depot_uuid : depot.depot_uuid,
        includeEmptyLot : '0',
        status : 'over_maximum',
      };

      dbPromises.push(core.getInventoryQuantityAndConsumption(
        paramsFilter,
        month_average_consumption,
        average_consumption_algo,
      ));
    } else if (status === 'require_po') {
      const paramsFilter = {
        period : 'allTime',
        depot_uuid : depot.depot_uuid,
        includeEmptyLot : '1',
        require_po : '1',
      };

      dbPromises.push(core.getInventoryQuantityAndConsumption(
        paramsFilter,
        month_average_consumption,
        average_consumption_algo,
      ));
    } else if (status === 'minimum_reached') {
      const paramsFilter = {
        period : 'allTime',
        depot_uuid : depot.depot_uuid,
        includeEmptyLot : '0',
        status : 'minimum_reached',
      };

      dbPromises.push(core.getInventoryQuantityAndConsumption(
        paramsFilter,
        month_average_consumption,
        average_consumption_algo,
      ));
    }
  });

  const rows = await Promise.all(dbPromises);
  depotsByUser.forEach((depot) => {
    let count = 0;
    depot.count = count;

    rows.forEach(row => {
      if (row.length) {
        if (status !== 'at_risk_expiration') {
          row.forEach(item => {
            if (depot.depot_uuid === item.depot_uuid) {
              count++;
            }
          });
        } else {
          const filteredData = row.filter(i => i.depot_uuid === depot.depot_uuid);

          if (filteredData.length) {
            const inventoriesAtRisk = filteredData.map(i => i.inventory_uuid);

            // Remove duplicate values from Inventory at risk expiration
            const uniqInventory = inventoriesAtRisk.reduce((a, b) => {
              if (a.indexOf(b) < 0) a.push(b);
              return a;
            }, []);
            count = uniqInventory.length;
          }
        }
      }
    });

    depot.count = count;
  });

  const filteredData = depotsByUser.filter(item => item.count > 0);

  res.status(200).json(filteredData);

}

/**
 * GET /stock/lots/depots/
 * returns list of each lots in each depots with their quantities
 * @param req
 * @param res
 */
async function listLotsDepot(req, res) {
  const params = req.query;

  params.month_average_consumption = req.session.stock_settings.month_average_consumption;
  params.average_consumption_algo = req.session.stock_settings.average_consumption_algo;
  params.min_delay = req.session.stock_settings.min_delay;
  params.default_purchase_interval = req.session.stock_settings.default_purchase_interval;

  if (req.session.stock_settings.enable_strict_depot_permission && !params.fullList) {
    params.check_user_id = req.session.user.id;
  }

  if (params.period) {
    params.defaultPeriodEntry = params.period;
    delete params.period;
  }


  const data = await core.getLotsDepot(null, params);

  // if no data is returned or if the skipTags flag is set, we don't need to do any processing
  // of tags.  Skip the SQL query and JS loops.
  if (!params.paging && data.length !== 0 && !params.skipTags) {
    await core.addLotTags(data);
  }

  if (params.paging && data.rows.length !== 0 && !params.skipTags) {
    await core.addLotTags(data.rows);
  }

  res.status(200).json(data);
}

/**
 * GET /stock/lots/depotsDetailed/
 * @param req
 * @param res
 * @description
 * returns list of each lots in each depots with their quantities
 */
async function listLotsDepotDetailed(req, res) {
  const params = req.query;

  params.startDate = moment(new Date(params.startDate)).format('YYYY-MM-DD');
  params.dateTo = moment(new Date(params.dateTo)).format('YYYY-MM-DD');
  const lastDayPreviousMonth = moment(params.startDate).subtract(1, 'day').format('YYYY-MM-DD');

  params.month_average_consumption = req.session.stock_settings.month_average_consumption;
  params.average_consumption_algo = req.session.stock_settings.average_consumption_algo;
  params.min_delay = req.session.stock_settings.min_delay;
  params.default_purchase_interval = req.session.stock_settings.default_purchase_interval;

  if (req.session.stock_settings.enable_strict_depot_permission) {
    params.check_user_id = req.session.user.id;
  }

  if (params.period) {
    params.defaultPeriodEntry = params.period;
    delete params.period;
  }

  const paramsPrevious = {
    dateTo : lastDayPreviousMonth,
    depot_uuid : params.depot_uuid,
    includeEmptyLot : 0,
    month_average_consumption : req.session.stock_settings.month_average_consumption,
    average_consumption_algo : req.session.stock_settings.average_consumption_algo,
    min_delay : req.session.stock_settings.min_delay,
    default_purchase_interval : req.session.stock_settings.default_purchase_interval,
    check_user_id : params.check_user_id,
  };

  const sqlGetMonthlyStockMovements = `
      SELECT BUID(l.inventory_uuid) AS inventory_uuid, BUID(sm.lot_uuid) AS lot_uuid,
        sm.date, inv.text AS inventoryText,
        l.label, SUM(IF(sm.is_exit = 1, sm.quantity, 0)) AS exit_quantity,
        SUM(IF(sm.is_exit = 0, sm.quantity, 0)) AS entry_quantity
      FROM stock_movement AS sm
      JOIN lot AS l ON l.uuid = sm.lot_uuid
      JOIN inventory AS inv ON inv.uuid = l.inventory_uuid
      WHERE sm.depot_uuid = ?
      AND DATE(sm.date) >= DATE(?) AND DATE(sm.date) <= DATE(?)
      GROUP BY l.uuid, sm.date;
    `;

  const [
    data,
    dataPreviousMonth,
    dataStockMovements,
  ] = await Promise.all([
    core.getLotsDepot(null, params),
    core.getLotsDepot(null, paramsPrevious),
    db.exec(sqlGetMonthlyStockMovements, [db.bid(params.depot_uuid), params.startDate, params.dateTo]),
  ]);

  const dataPaged = !params.paging ? data : data.rows;
  const dataPagedPreviousMonth = !params.paging ? dataPreviousMonth : dataPreviousMonth.rows;

  (dataPaged || []).forEach(current => {
    current.quantity_opening = 0;
    current.total_quantity_entry = 0;
    current.total_quantity_exit = 0;

    (dataPagedPreviousMonth || []).forEach(previous => {
      if (current.uuid === previous.uuid) {
        current.quantity_opening = previous.quantity;
      }
    });

    (dataStockMovements || []).forEach(row => {
      if (current.uuid === row.lot_uuid) {
        current.total_quantity_entry = row.entry_quantity;
        current.total_quantity_exit = row.exit_quantity;
      }
    });
  });

  const queryTags = `
      SELECT BUID(t.uuid) uuid, t.name, t.color, BUID(lt.lot_uuid) lot_uuid
      FROM tags t
        JOIN lot_tag lt ON lt.tag_uuid = t.uuid
      WHERE lt.lot_uuid IN (?)
    `;

  // if we have an empty set, do not query tags.
  if (dataPaged.length !== 0) {
    const lotUuids = dataPaged.map(row => db.bid(row.uuid));
    const tags = await db.exec(queryTags, [lotUuids]);

    // make a lot_uuid -> tags map.
    const tagMap = _.groupBy(tags, 'lot_uuid');

    dataPaged.forEach(lot => {
      lot.tags = tagMap[lot.uuid] || [];
    });
  }

  res.status(200).json(params.paging ? { pager : data.pager, rows : dataPaged } : dataPaged);
}

/**
 * GET /stock/inventory/depots/
 * returns list of each inventory in a given depot with their quantities and CMM
 * @param req
 * @param res
 * @todo process stock alert, rupture of stock
 * @todo prevision for purchase
 */
async function listInventoryDepot(req, res) {
  const params = req.query;

  // expose connected user data
  // In the case where a requisition request is made,
  // the new parameters (params.checkAvailableInventoriesRequisition) have been added
  // to allow the availability of stocks to be seen for the depots
  // for which the user does not have the right of access
  if (req.session.stock_settings.enable_strict_depot_permission && !params.checkAvailableInventoriesRequisition) {
    params.check_user_id = req.session.user.id;
  }

  params.month_average_consumption = req.session.stock_settings.month_average_consumption;
  params.average_consumption_algo = req.session.stock_settings.average_consumption_algo;
  params.min_delay = req.session.stock_settings.min_delay;
  params.default_purchase_interval = req.session.stock_settings.default_purchase_interval;
  params.enable_expired_stock_out = req.session.stock_settings.enable_expired_stock_out;

  // FIXME(@jniles) - these two call essentially the same route.  Do we need both?
  const [inventories, lots] = await Promise.all([
    core.getInventoryQuantityAndConsumption(params),
    core.getLotsDepot(null, params),
  ]);

  for (let i = 0; i < inventories.length; i++) {
    let hasRiskyLots = false;
    let hasExpiredLots = false;
    let hasNearExpireLots = false;

    let riskyLotsQuantity = 0;
    let expiredLotsQuantity = 0;
    let nearExpireLotsQuantity = 0;

    for (let j = 0; j < lots.length; j++) {
      const hasSameDepot = lots[j].depot_uuid === inventories[i].depot_uuid;
      const hasSameInventory = lots[j].inventory_uuid === inventories[i].inventory_uuid;
      if (hasSameDepot && hasSameInventory) {

        // NOTE(@jniles): at this point, we've called computeLotIndicators() in the
        // core.getLotsDepot() function.  This means we can use all the flags defined
        // in that function to compute those here.
        const lot = lots[j];

        if (lot.exhausted) {
          // skip exhausted lots
        } else if (lot.expired) {
          hasExpiredLots = true;
          expiredLotsQuantity += lot.quantity;
        } else if (lot.near_expiration) {
          hasNearExpireLots = true;
          nearExpireLotsQuantity += lot.quantity;

          // flag if any lots are at risk of running out
        } else if (lot.S_RISK_QUANTITY > 0) {
          hasRiskyLots = true;
          riskyLotsQuantity += lot.S_RISK_QUANTITY;
        }
      }
    }

    inventories[i].hasNearExpireLots = hasNearExpireLots;
    inventories[i].hasRiskyLots = hasRiskyLots;
    inventories[i].hasExpiredLots = hasExpiredLots;

    inventories[i].nearExpireLotsQuantity = nearExpireLotsQuantity;
    inventories[i].riskyLotsQuantity = riskyLotsQuantity;
    inventories[i].expiredLotsQuantity = expiredLotsQuantity;
    inventories[i].usableAvailableStock = inventories[i].quantity - expiredLotsQuantity;
  }

  let rows = inventories;

  if (params.show_only_risky) {
    rows = inventories.filter(item => (item.hasRiskyLots || item.hasNearExpireLots || item.hasExpiredLots));
  }

  res.status(200).json(rows);
}

/**
 * GET /stock/flux
 * returns list of stock flux
 * @param req
 * @param res
 */
async function listStockFlux(req, res) {
  const rows = await db.exec('SELECT id, label FROM flux;');
  res.status(200).json(rows);
}

/**
 * GET /stock/consumptions/:periodId
 * @param req
 * @param res
 */
async function getStockConsumption(req, res) {
  const { params } = req;
  const rows = await core.getStockConsumption(params.periodId);
  res.status(200).send(rows);
}

/**
 * GET /stock/consumptions/average/:periodId?number_of_months=...
 * @param req
 * @param res
 */
async function getStockConsumptionAverage(req, res) {
  const { query, params } = req;
  const rows = await core.getStockConsumptionAverage(params.periodId, query.number_of_months);
  res.status(200).send(rows);
}

/**
 * GET /stock/transfer
 * @param req
 * @param res
 */
async function getStockTransfers(req, res) {
  const params = req.query;

  // Get received transfer for the given depot
  const queryReceived = `
    SELECT
      COUNT(m.document_uuid) AS countedReceived,
      BUID(m.document_uuid) AS document_uuid,
      document_uuid AS binary_document_uuid
    FROM
      stock_movement m
    JOIN depot d ON d.uuid = m.depot_uuid
    WHERE d.uuid = ? AND m.is_exit = 0 AND m.flux_id = ${core.flux.FROM_OTHER_DEPOT}
    GROUP BY m.document_uuid
  `;

  // Get transfer for the given depot
  const query = `
    SELECT
      BUID(m.document_uuid) AS document_uuid, m.date,
      d.text AS depot_name, dd.text AS other_depot_name,
      dm.text AS document_reference,
      sh.name AS shipment_name,
      sh.created_at AS shipment_date,
      dm2.text AS shipment_reference,
      rx.countedReceived
    FROM
      stock_movement m
    JOIN depot d ON d.uuid = m.depot_uuid
    JOIN depot dd ON dd.uuid = m.entity_uuid
    LEFT JOIN document_map dm ON dm.uuid = m.document_uuid
    LEFT JOIN (${queryReceived}) rx ON rx.binary_document_uuid = m.document_uuid
    LEFT JOIN shipment sh ON sh.document_uuid = m.document_uuid
    LEFT JOIN document_map dm2 ON dm2.uuid = sh.uuid
    WHERE dd.uuid = ? AND m.is_exit = 1 AND m.flux_id = ${core.flux.TO_OTHER_DEPOT}
    GROUP BY m.document_uuid
  `;

  const rows = await db.exec(query, [db.bid(params.depot_uuid), db.bid(params.depot_uuid)]);
  res.status(200).json(rows);
}

