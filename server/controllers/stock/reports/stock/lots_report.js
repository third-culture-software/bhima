const moment = require('moment');
const debug = require('debug')('bhima:stock:reports:lots');
const {
  _, ReportManager, Stock, formatFilters, STOCK_LOTS_REPORT_TEMPLATE, stockStatusLabelKeys,
} = require('../common');


const i18n = require('../../../../lib/helpers/translate');

/**
 * @param req
 * @param res
 * @function stockLotsReport
 * @description
 * This method builds the stock lots report as either a JSON, PDF, or HTML
 * file to be sent to the client.
 *
 * GET /reports/stock/lots
 */
async function stockLotsReport(req, res) {
  const { lang } = req.query;
  let options = {};
  let display = {};
  const data = {};
  let filters;
  let hasFilter = false;

  const optionReport = Object.assign(req.query, { filename : 'TREE.STOCK_LOTS' });

  debug(`Rendering stock lots report in language: ${lang || 'default'}.`);

  // set up the report with report manager
  if (req.query.identifiers && req.query.display) {
    options = JSON.parse(req.query.identifiers);
    display = JSON.parse(req.query.display);
    filters = formatFilters(display);
    hasFilter = Object.keys(display).length > 0;
  } else {
    options = req.query;
  }

  const report = new ReportManager(STOCK_LOTS_REPORT_TEMPLATE, req.session, optionReport);

  if (options.defaultPeriod) {
    options.defaultPeriodEntry = options.defaultPeriod;
    delete options.defaultPeriod;
  }

  if (req.session.stock_settings.enable_strict_depot_permission) {
    debug(`Strict depot permissions is enabled.`);
    options.check_user_id = req.session.user.id;
  }

  options.month_average_consumption = req.session.stock_settings.month_average_consumption;
  options.average_consumption_algo = req.session.stock_settings.average_consumption_algo;

  const purgeKeys = [
    'NO_CONSUMPTION', 'S_MONTH', 'S_RISK', 'S_RISK_QUANTITY',
    'at_risk_of_stock_out', 'cmms', 'color',
    'default_purchase_interval', 'delay', 'depot_uuid',
    'enterprisePurchaseInterval', 'exhausted', 'expired',
    'inventory_uuid', 'lifetime_lot', 'min_delay',
    'min_months_security_stock', 'mvt_quantity', 'near_expiration',
    'purchase_interval', 'tag_name', 'tracking_consumption', 'wac'
  ];

  const dateKeys = ['min_stock_date', 'max_stock_date'];

  const rows = await Stock.getLotsDepot(null, options);

  debug(`Found ${rows.length} matching lots.`);

  rows.forEach(row => {
    const current = new Date();
    const delay = moment(new Date(row.expiration_date)).diff(current);
    row.delay_expiration = moment.duration(delay).humanize(true);

    // Purge unneeded fields from the row
    purgeKeys.forEach(key => { delete row[key]; });
    // Sanitize invalid dates
    dateKeys.forEach(key => {
      if (JSON.stringify(row[key]) === 'null') {
        row[key] = '';
      }
    });
    // translate the status field
    if (row.status in stockStatusLabelKeys) {
      row.status = i18n(lang)(stockStatusLabelKeys[row.status]);
    }
  });

  data.rows = rows;
  data.hasFilter = hasFilter;
  data.filters = filters;
  data.csv = rows;
  data.display = display;
  data.filters = formatFilters(options);

  // group by depot
  const groupedDepots = _.groupBy(rows, d => d.depot_text);
  const depots = {};

  debug(`Found lots in ${Object.keys(groupedDepots).join(',')}.`);

  Object.keys(groupedDepots).sort(compare).forEach(d => {
    depots[d] = _.sortBy(groupedDepots[d], line => String(line.text).toLocaleLowerCase());
  });

  data.depots = depots;
  const result = await report.render(data);
  res.set(result.headers).send(result.report);
}

/**
 *
 * @param a
 * @param b
 */
function compare(a, b) {
  return a.localeCompare(b);
}

module.exports = stockLotsReport;
