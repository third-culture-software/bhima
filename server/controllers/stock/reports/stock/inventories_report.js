const {
  _, db, ReportManager, formatFilters, Stock, STOCK_INVENTORIES_REPORT_TEMPLATE, stockStatusLabelKeys,
} = require('../common');

const i18n = require('../../../../lib/helpers/translate');

/**
 * @method stockInventoriesReport
 *
 * @description
 * This method builds the stock report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/inventories
 */
async function stockInventoriesReport(req, res) {
  const { lang } = req.query;
  const monthAverageConsumption = req.session.stock_settings.month_average_consumption;
  const averageConsumptionAlgo = req.session.stock_settings.average_consumption_algo;

  const data = {};

  const optionReport = _.extend({}, req.query, {
    filename : 'TREE.STOCK_INVENTORY',
    title : 'TREE.STOCK_INVENTORY',
  });

  const options = req.query;
  delete options.label;

  const filters = formatFilters(options);

  // Update the name for the depot filter if specified
  const depotFilter = filters.find(filt => filt.field === 'depot_uuid');
  if (depotFilter) {
    const depot = await db.one('SELECT text FROM depot WHERE uuid = ?', db.bid(depotFilter.value));
    depotFilter.value = depot.text;
  }

  // Update the name for the inventory filter if specified
  const inventoryFilter = filters.find(filt => filt.field === 'inventory_uuid');
  if (inventoryFilter) {
    const inventory = await db.one('SELECT text FROM inventory WHERE uuid = ?', db.bid(inventoryFilter.value));
    inventoryFilter.value = inventory.text;
  }

  if (req.session.stock_settings.enable_strict_depot_permission) {
    options.check_user_id = req.session.user.id;
  }

  const inventoriesParameters = [options, monthAverageConsumption, averageConsumptionAlgo];
  const report = new ReportManager(STOCK_INVENTORIES_REPORT_TEMPLATE, req.session, optionReport);
  const rows = await Stock.getInventoryQuantityAndConsumption(...inventoriesParameters);

  const purgeKeys = ['uuid', 'cmms', 'default_purchase_interval', 'delay', 'depot_uuid',
    'documentReference', 'enterprisePurchaseInterval', 'enterprise_id', 'entry_date',
    'expiration_date', 'group_uuid', 'inventory_uuid', 'last_movement_date', 'label',
    'min_delay', 'min_months_security_stock', 'NO_CONSUMPTION', 'purchase_interval',
    'S_MONTH', 'tag_color', 'tag_name', 'tracking_consumption', 'tracking_expiration',
    'unit_cost'];

  rows.forEach(row => {
    // Get the quantity out of CMMS
    row.quantity = row.cmms.quantity_in_stock;

    // Purge unneeded fields from the row
    purgeKeys.forEach(key => {
      delete row[key];
    });

    // translate the status field
    if (row.status in stockStatusLabelKeys) {
      row.status = i18n(lang)(stockStatusLabelKeys[row.status]);
    }

    // Capitalize status column header
    row.Status = row.status;
    delete row.status;
  });

  data.rows = rows;
  data.filters = filters;
  data.csv = rows;

  data.dateTo = options.dateTo;

  // group by depot
  const groupedDepots = _.groupBy(rows, d => d.depot_text);
  const depots = {};

  Object.keys(groupedDepots).sort(compare).forEach(d => {
    depots[d] = _.sortBy(groupedDepots[d], line => String(line.text).toLocaleLowerCase());
  });

  data.depots = depots;

  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

function compare(a, b) {
  return a.localeCompare(b);
}

module.exports = stockInventoriesReport;
