/**
 * The /helpdesk HTTP API endpoint.
 *
 * This controller is responsible for implementing READ access for the
 * help desk info in the Enterprise information.
 */

const db = require('../../lib/db');

// expose the read function
exports.read = helpdeskInfo;

/**
 * @function HelpdeskInfo
 * @description return the helpdesk info string
 * Should update to support a passed-in enterprise id
 */

function helpdeskInfo(req, res, next) {

  const sql = `select helpdesk
    FROM enterprise
    LIMIT 1;
  `;

  db.one(sql, [], 1, 'enterprise')
    .then((row) => res.status(200).json(row))
    .catch(next)
    
}
