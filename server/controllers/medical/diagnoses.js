/**
 * @module medical/diagnoses
 *
 * @description
 * This controller exposes the ICD10 diagnosis codes to the client.
 */

const db = require('../../lib/db');

exports.list = list;

/**
 * @method list
 *
 * @description
 * Lists all the ICD10 codes from the database.
 */
async function list(req, res) {
  const sql = 'SELECT id, code, label FROM icd10 ORDER BY code;';

  const codes = await db.exec(sql);
  res.status(200).json(codes);
}
