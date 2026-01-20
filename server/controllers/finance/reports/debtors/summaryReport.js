/**
 * @overview ./finance/reports/debtors/summaryReport.js
 *
*/

const _ = require('lodash');
const ReportManager = require('../../../../lib/ReportManager');
const db = require('../../../../lib/db');
const util = require('../../../../lib/util');

module.exports.summaryReport = summaryReport;

// path to the template to render
const TEMPLATE = './server/controllers/finance/reports/debtors/summaryReport.handlebars';

const DEFAULT_OPTIONS = {
  csvKey : 'debtors',
  filename : 'REPORT.DEBTOR_SUMMARY.TITLE',
  orientation : 'landscape',
};

/**
 * @method summaryReport
 *
 * @description
 * The HTTP interface which actually creates the report.
 */
async function summaryReport(req, res, next) {
  try {
    const qs = _.extend(req.query, DEFAULT_OPTIONS);
    const { dateFrom, dateTo } = req.query;
    const groupUuid = req.query.group_uuid;
    const metadata = structuredClone(req.session);

    const report = new ReportManager(TEMPLATE, metadata, qs);

    const inventoryGroupMap = {};
    const emptyArray = [];
    const inventoryGroupIndexMap = {};
    let gobalSum = 0;

    const invoiceSql = `
      SELECT BUID(i.uuid) AS invoice_uuid, i.date, dm.text AS invRef, ent.text AS debtorRef,
        d.text, SUM(it.transaction_price) AS amount, i.cost as total, BUID(i.debtor_uuid) AS debtor_uuid,
        invg.name as inventoryGroupName, BUID(invg.uuid) as inventoryGroupUuid, inv.text as inventoryName,
        BUID(i.service_uuid) AS service_uuid, s.name as serviceName
      FROM invoice i
      JOIN invoice_item it ON it.invoice_uuid = i.uuid
      JOIN inventory inv ON inv.uuid = it.inventory_uuid
      JOIN inventory_group invg ON invg.uuid = inv.group_uuid
      JOIN debtor d ON d.uuid = i.debtor_uuid
      JOIN debtor_group dg ON dg.uuid = d.group_uuid
      JOIN entity_map ent ON ent.uuid = d.uuid
      JOIN document_map dm ON dm.uuid = i.uuid
      JOIN service s ON s.uuid  =  i.service_uuid
      WHERE dg.uuid = ? AND (i.date BETWEEN ? AND ?) AND i.reversed = 0
      GROUP BY invg.uuid, i.uuid
      ORDER BY i.date
    `;

    const inventoryGroupsSql = `
      SELECT DISTINCT x.inventoryGroupUuid as id, x.inventoryGroupName as name
      FROM (${invoiceSql}) as x
    `;

    const debtorGroup = await db.one('SELECT name FROM debtor_group WHERE uuid=?', db.bid(groupUuid));
    const inventoryGroups = await db.exec(inventoryGroupsSql, [db.bid(groupUuid), dateFrom, dateTo]);

    // initilisation
    inventoryGroups.forEach((s, index) => {
      inventoryGroupMap[s.id] = s;
      inventoryGroupMap[s.id].total = 0;
      emptyArray.push(null);
      inventoryGroupIndexMap[s.id] = index;
    });

    // let get the list of invoices for this group
    const invoices = await db.exec(invoiceSql, [db.bid(groupUuid), dateFrom, dateTo]);

    const invoicesList = _.groupBy(invoices, 'invoice_uuid');
    const data = [];
    // let loop each invoice  attribute each invoice item to it inventoryGroup
    Object.keys(invoicesList).forEach(invKey => {
      const invItems = invoicesList[invKey];
      const record = { inventoryGroups : structuredClone(emptyArray) };
      invItems.forEach(item => {
        record.date = item.date;
        record.invRef = item.invRef;
        record.debtorRef = item.debtorRef;
        record.total = item.total;
        record.debtorName = item.text;
        record.serviceName = item.serviceName;
        record.inventoryGroups[inventoryGroupIndexMap[item.inventoryGroupUuid]] = item.amount;
        inventoryGroupMap[item.inventoryGroupUuid].total += item.amount;
      });
      data.push(record);
    });

    data.forEach(record => {
      gobalSum += record.total;
    });
    // then let render the report
    const result = await report.render({
      debtorGroup,
      inventoryGroups,
      data,
      dateFromMonth : dateFrom,
      dateToMonth : dateTo,
      gobalSum : util.roundDecimal(gobalSum, 2),
    });
    res.set(result.headers).send(result.report);
  } catch (ex) {
    next(ex);
  }
}
