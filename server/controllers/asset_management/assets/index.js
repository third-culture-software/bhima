const router = require('express').Router();

const { neededInventoryScansReport } = require('./reports/needed_inventory_scans');

const {
  _, ReportManager, Stock, formatFilters, ASSETS_REGISTRY_TEMPLATE, stockStatusLabelKeys,
} = require('../../stock/reports/common');

const i18n = require('../../../lib/helpers/translate');

/**
 * @method assetRegistryReport
 *
 * @description
 * This method builds the assets report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /assets/reports/registry
 */
async function assetRegistryReport(req, res) {
  const { lang } = req.query;

  const optionReport = _.extend(req.query, { filename : 'TREE.ASSETS_REGISTRY' });

  const options = req.query;

  const report = new ReportManager(ASSETS_REGISTRY_TEMPLATE, req.session, optionReport);

  if (options.defaultPeriod) {
    options.defaultPeriodEntry = options.defaultPeriod;
    delete options.defaultPeriod;
  }

  options.month_average_consumption = req.session.stock_settings.month_average_consumption;
  options.average_consumption_algo = req.session.stock_settings.average_consumption_algo;

  const purgeKeys = [
    'NO_CONSUMPTION', 'S_MONTH', 'S_RISK', 'S_RISK_QUANTITY',
    'S_MAX', 'S_MIN', 'S_SEC', 'S_Q',
    'at_risk_of_stock_out', 'cmms', 'color',
    'default_purchase_interval', 'delay', 'depot_uuid',
    'enterprisePurchaseInterval', 'exhausted', 'expired',
    'inventory_uuid', 'lifetime_lot', 'min_delay',
    'min_months_security_stock', 'mvt_quantity', 'near_expiration',
    'purchase_interval', 'tag_name', 'tracking_consumption',
    'tracking_expiration', 'wac',
  ];

  const dateKeys = ['min_stock_date', 'max_stock_date'];

  options.is_asset = 1;

  const rows = (await Stock.getLotsDepot(null, options))
    .map(row => {
      const item = _.omit(row, purgeKeys);

      // Sanitize invalid dates
      dateKeys.forEach(key => {
        if (JSON.stringify(item[key]) === 'null') {
          item[key] = '';
        }
      });

      // translate the status field
      if (item.status in stockStatusLabelKeys) {
        item.status = i18n(lang)(stockStatusLabelKeys[item.status]);
      }
      return item;
    });

  const data = {};

  data.rows = rows;
  data.csv = rows;

  data.filters = _.uniqBy(formatFilters(options), 'field');

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

/**
 * @description
 * This is the base "assets/" route to render the asset registry report.
 */
router.get('/reports/registry', assetRegistryReport);

router.neededInventoryScansReport = neededInventoryScansReport;

module.exports = router;
