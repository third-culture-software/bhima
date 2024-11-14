/**
 * @module patients/pictures
 *
 * @description
 *
 * The input for uploading patient images
 * It should accept any image type (.png, .gif, etc) but reject non-image types in Client Side.
 *
 * This controller encapsulates the HTTP API backing the patient documents feature
 * in the application.
 *
 * @requires multer
 * @requires db
 * @requires BadRequest
 */

const db = require('../../../lib/db');
const BadRequest = require('../../../lib/errors/BadRequest');

exports.set = set;

/**
 * @method set
 *
 * @description
 * This method checked if req.files.length is isset
 * Update the field avatar in table patient
 * Transfert the field in Server
 *
 * POST /patients/:uuid/pictures
 */

function set(req, res, next) {
  if (req.files.length === 0) {
    next(BadRequest('Expected at least one file upload but did not receive any files.'));
    return;
  }

  const data = {};

  data.avatar = req.files[0].link;

  const buid = db.bid(req.params.uuid);

  const sql = 'UPDATE patient SET ? WHERE uuid = ?';

  db.exec(sql, [data, buid])
    .then(() => {
      res.status(200).json({ link : data.avatar });
    })
    .catch(next);

}
