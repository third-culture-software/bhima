/**
 * @overview Inventory Changes Report
 *
 * @description
 * This report shows all the changes made to inventory items by different users.
 *
 * @requires ReportManager
 * @requires inventory/core
 * @requires lib/db
 */

const ReportManager = require('../../../lib/ReportManager');
const db = require('../../../lib/db');
const core = require('../inventory/core');

module.exports = inventoryChanges;

const TEMPLATE = './server/controllers/inventory/reports/changes.handlebars';

/**
 * Parses and transforms raw change log records into a structured format for the report.
 * @param {Array<Object>} records - The raw log records from the database.
 * @returns {Array<Object>} A flat array of change objects.
 */
function transformChangeLogRecords(records) {
  return records.flatMap((record) => {
    const { last, current } = JSON.parse(record.changes);
    const prev = formatKeys(last);
    const next = formatKeys(current);

    return Object.keys(next).map((key) => ({
      key,
      uuid : record.uuid,
      col : core.inventoryColsMap[key],
      value : getValue(prev, next, key),
      date : record.log_timestamp,
      userName : record.user_name,
      update : true,
    }));
  });
}

// groups an array by a key.
function groupBy(array, key) {
  return array.reduce((accumulator, row) => {

    // ensure that the accumulator has an entry for the group key
    if (!accumulator[row[key]]) {
      accumulator[row[key]] = [];
    }

    // push the matching row to the entry
    accumulator[row[key]].push(row);
    return accumulator;
  }, {});

}

async function inventoryChanges(req, res) {
  const metadata = { ...req.session };
  const params = { ...req.query };
  Object.assign(params, { filename : 'REPORT.INVENTORY_CHANGE.TITLE' });

  const currencyId = req.session.enterprise.currency_id;

  const report = new ReportManager(TEMPLATE, metadata, params);
  const { dateFrom, dateTo } = params;

  const inventorySql = `
    SELECT BUID(iv.uuid) AS uuid, iv.code, iv.text AS label, iv.created_at,
    iv.updated_at, ivt.text AS type,
    IF(ISNULL(ivu.token), ivu.text, CONCAT("INVENTORY.UNITS.",ivu.token,".TEXT")) AS unit_type,
    ivg.name AS group_name
    FROM inventory iv
      JOIN inventory_type ivt ON iv.type_id = ivt.id
      JOIN inventory_group ivg ON iv.group_uuid = ivg.uuid
      JOIN inventory_unit ivu ON iv.unit_id = ivu.id
    WHERE iv.uuid IN (
      SELECT inventory_log.inventory_uuid FROM inventory_log
      WHERE inventory_log.log_timestamp BETWEEN DATE(?) AND DATE(?)
    )
    ORDER BY ivg.name, iv.text;
  `;

  const logsSql = `
    SELECT BUID(ivl.inventory_uuid) AS uuid, ivl.text AS changes, u.display_name as user_name,
      ivl.log_timestamp
    FROM inventory_log ivl
      JOIN user u ON u.id = ivl.user_id
    WHERE ivl.log_timestamp BETWEEN DATE(?) AND DATE(?)
      AND ivl.text->"$.action" = "UPDATE"
    ORDER BY ivl.log_timestamp DESC;
  `;

  const [inventories, logs] = await Promise.all([
    db.exec(inventorySql, [dateFrom, dateTo]),
    db.exec(logsSql, [dateFrom, dateTo]),
  ]);

  // parse the changes to avoid doing that later
  let changelog = transformChangeLogRecords(logs);

  // TODO(@jniles): we have several changelog records where both the "to"
  // and "from" values are null.  This is because we have things like "updated_by" that are
  // not being filtered out, and some columns such as "manufacturer_brand" that seems to cause
  // the inventory_changes table to fill up with null values.
  // The fix currently is to filter this out of the view, but we should make sure
  // to sync up our inventory columns table with the text.
  changelog = changelog
    .filter(row => row.value.to !== null && row.value.from !== null)
    .filter(row => row.key !== 'updated_by');

  // group changelog by the inventory uuid
  const changeMap = groupBy(changelog, 'uuid');

  inventories.forEach(inventory => {
    inventory.logs = changeMap[inventory.uuid] || [];
    inventory.logs.forEach(log => {
      if (log.col === 'FORM.LABELS.UNIT_PRICE'
        && (typeof log.value.to === 'number' || typeof log.value.from === 'number')) {
        log.is_unit_price = true;
      }
    });
  });

  // only show inventory items that have at least one change.
  const inventoriesWithChanges = inventories.filter(inventory => inventory.logs.length > 0);

  const userChanges = Object.entries(
    changelog.reduce((acc, log) => {
      acc[log.userName] = (acc[log.userName] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([user, numberOfChanges]) => ({ user, numberOfChanges }))
    .sort((a, b) => b.numberOfChanges - a.numberOfChanges);

  const renderResult = await report.render({
    inventories : inventoriesWithChanges,
    dateFrom,
    dateTo,
    userChanges,
    currencyId,
  });
  res.set(renderResult.headers).send(renderResult.report);
}

/**
 * Prepares a record for comparison by aliasing 'text' to 'label' and removing internal keys.
 * @param {Object} record - The record to format.
 * @returns {Object} The formatted record.
 */
function formatKeys(record) {
  const {
    group_uuid, type_id, unit_id, text, ...rest // eslint-disable-line camelcase
  } = record;
  const newRecord = { ...rest };
  if (text) { newRecord.label = text; }
  return newRecord;
}

/**
 * Extracts the 'from' and 'to' values for a specific changed key.
 * @param {Object} last - The previous state of the record.
 * @param {Object} current - The new state of the record.
 * @param {string} key - The key that was changed.
 * @returns {{from: *, to: *}} An object containing the old and new values.
 */
function getValue(last, current, key) {
  const result = {};

  switch (key) {
  case 'tags':
    result.from = `[${last.tags.map(tag => `"${tag.name}"`).join(',  ')}]`;
    result.to = `[${current.tags.map(tag => `"${tag.name}"`).join(',  ')}]`;
    break;
  case 'inventoryGroup':
    result.from = last.groupName || '';
    result.to = current.inventoryGroup.name || '';
    break;
  case 'inventoryType':
    result.from = last.type;
    result.to = current.inventoryType.text;
    break;
  case 'inventoryUnit':
    result.from = last.unit;
    result.to = current.inventoryUnit.text;
    break;
  default:
    result.from = last[key];
    result.to = current[key];
  }
  return result;
}
