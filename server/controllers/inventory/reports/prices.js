/**
 * @overview Price Report
 *
 * @description
 * This file describes the price list report - it produces the list of prices to
 * be used as a physical reference for invoicing.
 *
 * @requires lodash
 * @requires ReportManager
 * @requires inventorycore
 */

const _ = require('lodash');
const ReportManager = require('../../../lib/ReportManager');
const inventorycore = require('../inventory/core');

const shared = require('../../finance/reports/shared');

module.exports = prices;

const TEMPLATE = './server/controllers/inventory/reports/prices.handlebars';

async function prices(req, res, next) {
  const params = structuredClone(req.query);
  const filters = shared.formatFilters(params);

  const qs = _.extend(req.query, {
    csvKey : 'groups',
    orientation : 'landscape',
    filename : 'INVENTORY.PRICE_LIST_REPORT',
  });

  const metadata = structuredClone(req.session);

  try {
    const report = new ReportManager(TEMPLATE, metadata, qs);

    const items = await inventorycore.getItemsMetadata(params);
    let groups = _.groupBy(items, i => i.groupName);

    // make sure that they keys are sorted in alphabetical order
    groups = _.mapValues(groups, lines => {
      _.sortBy(lines, 'label');
      return lines;
    });

    const result = await report.render({ groups, filters });
    res.set(result.headers).send(result.report);
  } catch (e) {
    next(e);
  }
}
