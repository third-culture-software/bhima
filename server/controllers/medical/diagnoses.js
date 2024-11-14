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
function list(req, res, next) {
  const sql = 'SELECT id, code, label FROM icd10 ORDER BY code;';

  db.exec(sql)
    .then(codes => res.status(200).json(codes))
    .catch(next);

}
