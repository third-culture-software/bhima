const db = require('../../../../../lib/db');

const IS_EXIT = 1;
const EXIT_TO_PATIENT_ID = 9;
const BASE_SQL = `
  SELECT
    i.code, i.text, iu.text AS unit_text, BUID(m.document_uuid) AS document_uuid,
    SUM(m.quantity * m.unit_cost) AS cost, m.unit_cost,
    SUM(m.quantity) AS quantity, m.date, m.description,
    u.display_name AS user_display_name, p.display_name AS patient_display_name,
    dm.short_name AS document_reference, d.text AS depot_name,
    em.short_name AS patient_reference, dm2.short_name AS invoice_reference
  FROM stock_movement m
    JOIN lot l ON l.uuid = m.lot_uuid
    JOIN inventory i ON i.uuid = l.inventory_uuid
    JOIN inventory_unit iu ON iu.id = i.unit_id
    JOIN depot d ON d.uuid = m.depot_uuid
    JOIN patient p ON p.uuid = m.entity_uuid
    JOIN user u ON u.id = m.user_id
    JOIN uuid_map dm ON dm.uuid = m.document_uuid
    LEFT JOIN uuid_map em ON em.uuid = m.entity_uuid
    LEFT JOIN uuid_map dm2 ON dm2.uuid = m.invoice_uuid
  WHERE m.depot_uuid = ?
    AND m.is_exit = ${IS_EXIT}
    AND m.flux_id = ${EXIT_TO_PATIENT_ID}
    AND m.date >= DATE(?) AND m.date < DATE(?)
`;

/**
 * @param depotUuid
 * @param dateFrom
 * @param dateTo
 * @param showDetails
 * @function fetch
 * @description fetch stock exit for patient
 */
function fetch(depotUuid, dateFrom, dateTo) {
  const sql = BASE_SQL.concat('GROUP BY i.uuid ORDER BY i.text, m.date ASC');
  return db.exec(sql, [db.bid(depotUuid), new Date(dateFrom), new Date(dateTo)]);
}

/**
 *
 * @param depotUuid
 * @param dateFrom
 * @param dateTo
 */
function fetchDetails(depotUuid, dateFrom, dateTo) {
  const sql = BASE_SQL.concat('GROUP BY i.uuid, m.uuid ORDER BY i.text, m.date ASC');
  return db.exec(sql, [db.bid(depotUuid), new Date(dateFrom), new Date(dateTo)]);
}

module.exports.fetch = fetch;
module.exports.fetchDetails = fetchDetails;
