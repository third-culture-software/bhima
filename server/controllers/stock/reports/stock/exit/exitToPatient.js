const db = require('../../../../../lib/db');

const IS_EXIT = 1;
const EXIT_TO_PATIENT_ID = 9;

/**
 * @function fetch
 * @description fetch stock exit for patient
 */
function fetch(depotUuid, dateFrom, dateTo, showDetails) {
  const sql = `
  SELECT
    i.code, i.text, iu.text AS unit_text, BUID(m.document_uuid) AS document_uuid,
    SUM(m.quantity * m.unit_cost) AS cost, m.unit_cost,
    SUM(m.quantity) as quantity, m.date, m.description,
    u.display_name AS user_display_name, p.display_name AS patient_display_name,
    dm.short_name AS document_reference, d.text AS depot_name,
    em.short_name AS patient_reference, dm2.short_name AS invoice_reference
  FROM stock_movement m
    JOIN lot l ON l.uuid = m.lot_uuid
    JOIN inventory i ON i.uuid = l.inventory_uuid
    JOIN inventory_unit iu ON iu.id = i.unit_id
    JOIN depot d ON d.uuid = m.depot_uuid
    JOIN patient p ON p.uuid = m.entity_uuid
    JOIN project proj ON proj.id = p.project_id
    JOIN user u ON u.id = m.user_id
    JOIN uuid_map dm ON dm.uuid = m.document_uuid
    LEFT JOIN invoice iv ON iv.uuid = m.invoice_uuid
    LEFT JOIN uuid_map dm2 ON dm2.uuid = iv.uuid
    LEFT JOIN uuid_map em ON em.uuid = p.uuid
  WHERE m.is_exit = ${IS_EXIT} AND m.flux_id = ${EXIT_TO_PATIENT_ID} AND d.uuid = ?
    AND (DATE(m.date) BETWEEN DATE(?) AND DATE(?))
  GROUP BY i.uuid`;

  const groupBy = ', m.uuid, p.uuid';
  const orderBy = ' ORDER BY i.text, m.date ASC';
  const query = showDetails ? sql.concat(groupBy, orderBy) : sql.concat(orderBy);

  const _depotUuid = db.bid(depotUuid);
  const _dateFrom = new Date(dateFrom);
  const _dateTo = new Date(dateTo);
  return db.exec(query, [_depotUuid, _dateFrom, _dateTo]);
}

module.exports.fetch = fetch;
