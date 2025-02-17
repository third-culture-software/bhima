const _ = require('lodash');
const moment = require('moment');

const db = require('../../../lib/db');
const core = require('../core');

exports.getData = getData;

// default report parameters
const DEFAULT_PARAMS = {
  csvKey : 'stock_report',
  filename : 'REPORT.STOCK_REPORT.TITLE',
  orientation : 'landscape',
};

/**
 * @method getData
 *
 * @description
 * This method builds the monthly stock report
 *
 * GET /stock/stock_report
 */
async function getData(reqQuery) {
  const params = reqQuery;
  params.depotUuid = params.depotUuid || params.depot_uuid;
  params.is_asset = parseInt(params.is_asset, 10);
  params.is_consumable = parseInt(params.is_consumable, 10);

  const data = {};
  const headerReport = [];
  const configurationData = [];

  params.start_date = moment(new Date(params.start_date)).format('YYYY-MM-DD');
  params.end_date = moment(new Date(params.end_date)).format('YYYY-MM-DD');

  const startDate = parseInt(moment(params.start_date).format('DD'), 10);
  const endDate = parseInt(moment(params.end_date).format('DD'), 10);

  const lastDayPreviousMonth = moment(params.start_date).subtract(1, 'day').format('YYYY-MM-DD');

  for (let i = startDate; i <= endDate; i++) {
    headerReport.push(i);
  }

  data.params = params;
  data.header = headerReport;

  const parameterOpeningStock = {
    depot_uuid : params.depotUuid,
    dateTo : lastDayPreviousMonth,
    includeEmptyLot : 1,
  };

  const parameterEndingStock = {
    depot_uuid : params.depotUuid,
    dateTo : params.end_date,
    includeEmptyLot : 1,
  };

  _.defaults(params, DEFAULT_PARAMS);

  try {

    const sqlDailyConsumption = `
      SELECT BUID(sms.inventory_uuid) AS uuid, inv.code, inv.text AS inventory_text,
        (sms.out_quantity_consumption + sms.out_quantity_exit) AS quantity,
        sms.in_quantity, sms.quantity_delta, sms.date
      FROM stock_movement_status AS sms
      JOIN inventory AS inv ON inv.uuid = sms.inventory_uuid
      WHERE sms.depot_uuid = ? AND sms.date >= DATE(?) AND sms.date <= DATE(?)
    `;

    const sqlMonthlyConsumption = `
      SELECT BUID(sms.inventory_uuid) AS uuid, inv.code, inv.text AS inventory_text, sms.date,
        SUM(sms.out_quantity_consumption + sms.out_quantity_exit) AS quantityTotalExit,
        SUM(sms.in_quantity) AS quantityTotalEntry,
        SUM(sms.out_quantity_consumption) AS outQuantityConsumption,
        SUM(sms.out_quantity_exit) AS outQuantityExit
      FROM stock_movement_status AS sms
        JOIN inventory AS inv ON inv.uuid = sms.inventory_uuid
      WHERE sms.depot_uuid = ? AND sms.date >= DATE(?) AND sms.date <= DATE(?)
      GROUP BY sms.inventory_uuid;
    `;

    const [
      inventoriesOpening,
      inventoriesConsumed,
      monthlyConsumption,
      inventoriesEnding,
    ] = await Promise.all([
      core.getInventoryQuantityAndConsumption(parameterOpeningStock),
      db.exec(sqlDailyConsumption, [db.bid(params.depotUuid), params.start_date, params.end_date]),
      db.exec(sqlMonthlyConsumption, [db.bid(params.depotUuid), params.start_date, params.end_date]),
      core.getInventoryQuantityAndConsumption(parameterEndingStock),
    ]);

    inventoriesEnding.forEach(inventory => {
      configurationData.push({
        inventoryUuid : inventory.inventory_uuid,
        inventoryText : inventory.text,
        quantityOpening : 0,
        quantityTotalEntry : 0,
        quantityTotalExit : 0,
        outQuantityConsumption : 0,
        outQuantityExit : 0,
        quantityEnding : inventory.quantity,
      });
    });

    let totalDaysStockOut = 0;
    let totalDays = 0;

    configurationData.forEach(inventory => {
      // First populate the monthly stats
      if (monthlyConsumption.length) {
        monthlyConsumption.forEach(row => {
          if (inventory.inventoryUuid === row.uuid) {
            inventory.quantityTotalExit = row.quantityTotalExit;
            inventory.quantityTotalEntry = row.quantityTotalEntry;
            inventory.outQuantityConsumption = row.outQuantityConsumption;
            inventory.outQuantityExit = row.outQuantityExit;
          }
        });
      }
      // Add the opening balance for each inventory article
      if (inventoriesOpening.length) {
        inventoriesOpening.forEach(opening => {
          if (inventory.inventoryUuid === opening.inventory_uuid) {
            inventory.quantityOpening = opening.quantity;
          }
        });
      }

      const dailyConsumption = [];
      for (let i = startDate; i <= endDate; i++) {
        dailyConsumption.push({ index : i, consumed : 0 });
      }

      // Construct a consumed inventories data set for this inventory item
      // to simplify the logic for constructing balances.
      const invDailyConsumed = inventoriesConsumed.filter(item => item.uuid === inventory.inventoryUuid);
      invDailyConsumed.forEach(item => {
        item.dayNum = parseInt(moment(item.date).format('DD'), 10);
      });

      invDailyConsumed.sort((a, b) => a.date > b.date);
      let lastBalance = inventory.quantityOpening;
      let numStockOutDays = 0;
      dailyConsumption.forEach(d => {
        const consumed = invDailyConsumed.find(item => item.dayNum === d.index);
        if (consumed) {
          d.consumed = consumed.quantity;
          d.incoming = consumed.in_quantity;
          d.balance = lastBalance + consumed.quantity_delta;
        } else {
          d.balance = lastBalance;
        }

        // Save the balance for the next day
        lastBalance = d.balance;

        if (d.balance === 0) {
          numStockOutDays += 1;
        }
      });

      inventory.numStockOutDays = numStockOutDays;
      inventory.percentStockOut = Number(100 * (numStockOutDays / dailyConsumption.length)).toFixed(1);

      totalDaysStockOut += numStockOutDays;
      totalDays += dailyConsumption.length;

      inventory.dailyConsumption = dailyConsumption;
    });

    data.configurationData = configurationData;

    if (params.exclude_out_stock) {
      data.configurationData = data.configurationData.filter(item => {
        return item.quantityEnding > 0 && ((item.quantityTotalEntry > 0 && item.quantityTotalExit > 0));
      });
    }

    data.totals = { totalDaysStockOut, totalDays, ratio : (100 * (totalDaysStockOut / totalDays)).toFixed(2) };
    data.totals.colspan = data.header.length + 2;
    // return data and processed parameters
    return { data, params };
  } catch (e) {
    throw new Error(e);
  }
}
