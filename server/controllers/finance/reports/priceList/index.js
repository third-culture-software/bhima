/**
 * @overview server/controllers/finance/reports/priceList/index.js
 *
 * @description
 * This file contains code to create a PDF report for a price list
 *
 * @requires db
 * @requires lodash
 * @requires util
 * @requires ReportManager
 */

const _ = require('lodash');
const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');
const util = require('../../../../lib/util');
const priceList = require('../../priceLists');

const TEMPLATE = './server/controllers/finance/reports/priceList/report.handlebars';

const PDF_OPTIONS = {
  filename : 'INVENTORY.PRICE_LIST_REPORT',
};

exports.report = (req, res, next) => {
  const options = req.query;

  let report;

  _.defaults(options, PDF_OPTIONS);

  // set up the report with report manager
  try {
    report = new ReportManager(TEMPLATE, req.session, options);

    const priceListUUID = db.bid(req.params.uuid);
    return lookupPriceList(priceListUUID).then(([row, rows]) => {
      const _priceList = row;
      _priceList.items = rows;
      const { items } = _priceList;

      items.forEach(item => {
        if (item.priceListValue) {
          if (item.is_percentage === 1) {
            item.price += util.roundDecimal((item.price * item.priceListValue) / 100, 2);
          } else {
            item.price = util.roundDecimal(item.priceListValue, 2);
          }
        }
      });
      // group by inventory group
      let groups = _.groupBy(items, i => i.groupName);

      // make sure that they keys are sorted in alphabetical order
      groups = _.mapValues(groups, lines => {
        _.sortBy(lines, 'label');
        return lines;
      });
      return report.render({ groups });
    })
      .then(result => {
        res.set(result.headers).send(result.report);
      })
      .catch(next);

  } catch (e) {
    return next(e);
  }
};

function lookupPriceList(uuid) {
  const priceListSql = `
    SELECT BUID(uuid) AS uuid, label, description, created_at, updated_at
    FROM price_list WHERE uuid = ?;`;

  const inventorySql = `
    SELECT BUID(inventory.uuid) as uuid, inventory.code, inventory.text AS label, inventory.price,
      IF(ISNULL(iu.token), iu.text, CONCAT("INVENTORY.UNITS.",iu.token,".TEXT")) AS unit_type,
      it.text AS type, ig.name AS groupName, BUID(ig.uuid) AS group_uuid, ig.tracking_expiration,
      ig.unique_item, inventory.consumable,inventory.locked, inventory.stock_min,
      inventory.stock_max, inventory.created_at AS timestamp, inventory.type_id, inventory.unit_id,
      inventory.note,  inventory.unit_weight, inventory.unit_volume,
      ig.sales_account, ig.stock_account, inventory.sellable, inventory.note,
      inventory.unit_weight, inventory.unit_volume, ig.sales_account, ig.stock_account,
      ig.cogs_account, inventory.default_quantity, s1.priceListValue, s1.is_percentage
    FROM inventory
      JOIN inventory_type AS it ON inventory.type_id = it.id
      JOIN inventory_unit AS iu  ON  inventory.unit_id = iu.id
      JOIN inventory_group AS ig ON inventory.group_uuid = ig.uuid
    LEFT JOIN(
      SELECT pl.inventory_uuid, pl.value as priceListValue, pl.is_percentage,
        pl.created_at, iv.text as inventoryLabel, iv.price
      FROM price_list_item pl
      JOIN inventory as iv ON iv.uuid = pl.inventory_uuid
      WHERE pl.price_list_uuid = ?)s1 ON s1.inventory_uuid = inventory.uuid
      ORDER BY inventory.code ASC
    `;

  return Promise.all([
    db.one(priceListSql, [uuid]),
    db.exec(inventorySql, [uuid]),
  ]);
}

exports.downloadRegistry = (req, res, next) => {

  const REPORT_TEMPLATE = './server/controllers/finance/reports/priceList/registry.handlebars';

  const options = _.extend(req.query, {
    filename                 : 'FORM.LABELS.PRICE_LIST',
    orientation              : 'portrait',
    csvKey                   : 'rows',
    suppressDefaultFiltering : true,
    suppressDefaultFormatting : false,
  });

  let report;

  try {
    report = new ReportManager(REPORT_TEMPLATE, req.session, options);
  } catch (e) {
    return next(e);
  }

  return priceList.lookup(req).then(rows => {
    return report.render({ rows });
  })
    .then((result) => {
      res.set(result.headers).send(result.report);
    })
    .catch(next);

};
