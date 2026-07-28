const {
  db, ReportManager, STOCK_EXPIRATION_REPORT_TEMPLATE,
} = require('../common');



const stockCore = require('../../core');
const Exchange = require('../../../finance/exchange');
const util = require('../../../../lib/util');

/**
 *
 * @param rows
 * @param exchangeRate
 */
function exchange(rows, exchangeRate) {

  rows.forEach(row => {
    row.unit_cost *= exchangeRate;
  });

  return rows;
}

/**
 * @param req
 * @param res
 * @function stockExpirationReport
 * @description
 */
async function stockExpirationReport(req, res) {
  const today = new Date();

  const options = { trackingExpiration : 1, includeEmptyLot : 0, ...req.query };
  const currencyId = parseInt(req.query.currencyId, 10);

  const optionReport = Object.assign(options, {
    filename : 'REPORT.STOCK_EXPIRATION_REPORT.TITLE',
  });

  // set up the report with report manager
  const report = new ReportManager(STOCK_EXPIRATION_REPORT_TEMPLATE, req.session, optionReport);

  if (req.session.stock_settings.enable_strict_depot_permission) {
    options.check_user_id = req.session.user.id;
  }

  let depot = {};

  if (options.depot_uuid) {
    const depotSql = 'SELECT text FROM depot WHERE uuid = ?';
    depot = await db.one(depotSql, db.bid(options.depot_uuid));
  }

  const exRate = await Exchange.getExchangeRate(req.session.enterprise.id, currencyId, new Date());
  const exchangeRate = exRate.rate || 1;

  // clean off the label if it exists so it doesn't mess up the PDF export
  delete options.label;

  // define month average and the algo to use
  // eslint-disable-next-line
  const { month_average_consumption, average_consumption_algo, min_delay } = req.session.stock_settings;
  
  Object.assign(options, { month_average_consumption, average_consumption_algo });

  // get the lots for this depot
  const lots = await stockCore.getLotsDepot(options.depot_uuid, options);

// Identify lots that are near expiration or already expired.
  const riskyLots = lots.filter(lot => lot.near_expiration && lot.lifetime > 0);
  const expiredLots = lots.filter(lot => lot.expired);

    // merge risky and expired
  // Apply the exchange rate.
  const riskyAndExpiredLots = exchange(
    [...riskyLots, ...expiredLots],
    exchangeRate
  );

  // make sure lots are grouped by depot.
  const groupedByDepot = util.groupBy(riskyAndExpiredLots, 'depot_uuid');

  // grand totals
  const totals = {
    expired : { value : 0, quantity : 0 },
    at_risk_of_stock_out : { value : 0, quantity : 0 },
  };

  const values = Object.values(groupedByDepot).map(rows => {
    let total = 0;

    for (const lot of rows) {
      if (lot.expiration_date < today) {
        lot.value = lot.mvt_quantity * lot.unit_cost;
        lot.statusKey = 'STOCK.EXPIRED';
        lot.classKey = 'bg-danger text-danger';

        totals.expired.value += lot.value;
        totals.expired.quantity += lot.mvt_quantity;
      } else {
        lot.quantity_at_risk = lot.S_RISK_QUANTITY;
        lot.value = lot.quantity_at_risk * lot.unit_cost;
        lot.statusKey = 'STOCK.STATUS.IS_IN_RISK_OF_EXPIRATION';
        lot.classKey = 'bg-warning text-warning';

        totals.at_risk_of_stock_out.value += lot.value;
        totals.at_risk_of_stock_out.quantity += lot.quantity_at_risk;
      }

      total += lot.value;
    }

    return {
      total,
      rows,
      depot_name: rows[0].depot_text,
    };
  });

  const reportResult = await report.render({
    result : values,
    currencyId,
    exchangeRate,
    depot,
    depotName : depot.text,
    totals,
    today,
  });

  res.set(reportResult.headers).send(reportResult.report);
}

module.exports = stockExpirationReport;
