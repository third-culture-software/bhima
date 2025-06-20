/**
 * @module reports
 *
 * @description
 * Controller responsible for exposing data for archived reports. Provides
 * utilities to list details about individual report keys as well as serving
 * archived reports.
 *
 * @requires fs/promises
 * @requires debug
 * @requires path
 * @requires moment
 * @requires db
 * @requires lib/barcode
 * @requires lib/errors/BadRequest
 * @requires lib/mailer
 */

const fs = require('fs/promises');
const debug = require('debug')('reports');
const path = require('path');
const moment = require('moment');

const db = require('../lib/db');
const barcode = require('../lib/barcode');
const BadRequest = require('../lib/errors/BadRequest');
const mailer = require('../lib/mailer');

exports.keys = keys;
exports.list = list;
exports.sendArchived = sendArchived;
exports.deleteArchived = deleteArchived;
exports.emailArchived = emailArchived;
exports.barcodeLookup = barcodeLookup;
exports.barcodeRedirect = barcodeRedirect;

/**
 * @function keys
 *
 * @description
 * Provide detailed information about an individual archivable report entry.
 * This route is used to drive the generic report page.
 *
 * GET /reports/keys/:key
 */
async function keys(req, res) {
  const sql = `SELECT * FROM report WHERE report_key = ?;`;
  const keyDetail = await db.exec(sql, [req.params.key]);
  res.status(200).json(keyDetail);
}

/**
 * @function list
 *
 * @description
 * Return a list of all report entries given a specific report key.
 *
 * GET /reports/saved/:reportId
 */
async function list(req, res) {
  const sql = `
    SELECT
      BUID(saved_report.uuid) as uuid, label, report_id,
      parameters, link, timestamp, user_id,
      user.display_name
    FROM saved_report left join user on saved_report.user_id = user.id
    WHERE report_id = ?`;

  const results = await db.exec(sql, [req.params.reportId]);
  res.status(200).json(results);
}

/**
 * @function lookupArchivedReport
 *
 * @description
 * Finds an archived report by it's UUID.
 *
 * @param {String} uuid - the report's uuid.
 * @returns {Promise} - the report record
 */
function lookupArchivedReport(uuid) {
  const sql = `
    SELECT BUID(saved_report.uuid) as uuid, label, report_id, parameters, link,
      timestamp, user_id, user.display_name
    FROM saved_report left join user on saved_report.user_id = user.id
    WHERE uuid = ?;
  `;

  return db.one(sql, [db.bid(uuid)]);
}

/**
 * @function sendArchived
 *
 * @description
 * Sends a file stored on the server hard disk given a UUID. Report files can
 * be listed with the /reports/saved route.
 *
 * GET /reports/archive/:uuid
 */
async function sendArchived(req, res) {
  const report = await lookupArchivedReport(req.params.uuid);
  const extension = path.extname(report.link);
  res.download(report.link, `${report.label}${extension}`);
}

/**
 * @function deleteArchived
 *
 * @description
 * Deletes a report from the server.  This cleans up both the record of the
 * report stored in saved_report and the file stored on the disk.
 *
 * DELETE /reports/archive/:uuid
 */
async function deleteArchived(req, res) {
  const report = await lookupArchivedReport(req.params.uuid);
  await db.exec('DELETE FROM saved_report WHERE uuid = ?;', [db.bid(req.params.uuid)]);
  await fs.unlink(report.link);
  res.sendStatus(204);
}

// TODO(@jniles) - translate these emails into multiple languages
const REPORT_EMAIL = `Hello!

Please find the attached report "%filename%" produced by %user% on %date%.

This email was requested by %requestor%.

Thanks,
bhi.ma
`;

// this is a really quick and lazy templating scheme
const template = (str, values) => {
  return Object.keys(values)
    .reduce((formatted, key) => formatted.replace(`%${key}%`, values[key]), str);
};

/**
 * @function emailArchived
 *
 * @description
 * Emails an archived report to an email address provided in the "to" field.
 */
async function emailArchived(req, res) {
  const { uuid } = req.params;
  const { address } = req.body;

  debug(`#emailArchived(): Received email request for ${address}.`);

  const report = await lookupArchivedReport(uuid);
  debug(`#emailArchived(): sending ${report.label} to ${address}.`);

  const date = moment(report.timestamp).format('YYYY-MM-DD');
  const filename = `${report.label}.pdf`;

  const attachments = [
    { filename, path : report.link },
  ];

  // template parameters for the email
  const parameters = {
    filename,
    date,
    user : report.display_name,
    requestor : req.session.user.display_name,
  };

  // template in the parameters into message body
  const message = template(REPORT_EMAIL, parameters);
  const subject = `${report.label} - ${date}`;

  await mailer.email(address, subject, message, { attachments });
  debug(`#emailArchived(): email sent to ${address}.`);
  res.sendStatus(200);
}

// Method to return the object
// Method to redirect
async function barcodeLookup(req, res) {
  const result = await barcode.reverseLookup(req.params.key);
  res.send(result);
}

async function barcodeRedirect(req, res) {
  const result = await barcode.reverseLookup(req.params.key);

  // populated by barcode controller
  if (!result._redirectPath) {
    throw new BadRequest('This barcode document does not support redirect');
  }
  res.redirect(result._redirectPath);
}
