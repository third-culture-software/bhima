/**
 * @overview Languages
 *
 * @description
 * This tiny controller is only to echo the languages supported until a better
 * place is found for the code.
 *
 * @requires db
 */

const db = require('../../lib/db');

exports.list = list;

// GET /languages
async function list(req, res) {
  const sql = `
    SELECT lang.id, lang.name, lang.key, lang.locale_key AS localeKey
    FROM language AS lang;
  `;

  const rows = await db.exec(sql);
  res.status(200).json(rows);
}
