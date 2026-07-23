/**
 * @file Price Report
 * @description
 * This file describes the price list report - it produces the list of prices to
 * be used as a physical reference for invoicing.
 * @requires ReportManager
 * @requires inventorycore
 */

const ReportManager = require('../../../lib/ReportManager');
const inventorycore = require('../inventory/core');

const shared = require('../../finance/reports/shared');

module.exports = prices;

const TEMPLATE = './server/controllers/inventory/reports/prices.handlebars';

/**
 *
 * @param req
 * @param res
 */
async function prices(req, res) {
  const params = structuredClone(req.query);
  const filters = shared.formatFilters(params);

  const qs = {
    ...req.query, 
    csvKey : 'groups',
    orientation : 'landscape',
    filename : 'INVENTORY.PRICE_LIST_REPORT',
  };

  const metadata = structuredClone(req.session);

  const report = new ReportManager(TEMPLATE, metadata, qs);

  const items = await inventorycore.getItemsMetadata(params);
  let groups = Object.groupBy(items, i => i.groupName);

  // Sort the internal arrays by label
  Object.values(groups).forEach(lines => {
    lines.sort((a, b) => a.label.localeCompare(b.label));
  });

  const result = await report.render({ groups, filters });
  res.set(result.headers).send(result.report);
}
