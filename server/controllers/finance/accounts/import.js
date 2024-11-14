/**
 * Account Import Module
 *
 * This module is responsible of handling the import of accounts
 * and related stock quantities
 */
const path = require('path');

const util = require('../../../lib/util');
const db = require('../../../lib/db');
const BadRequest = require('../../../lib/errors/BadRequest');

const IMPORT_DEFAULT_OHADA_ACCOUNTS = 1;
const IMPORT_CUSTOM_OHADA_ACCOUNTS = 2;
const IMPORT_OTHER_ACCOUNTS = 3;

exports.downloadTemplate = downloadTemplate;
exports.importAccounts = importAccounts;

/**
 * @method downloadTemplate
 *
 * @description send to the client the template file for account import
*/
function downloadTemplate(req, res, next) {
  try {
    const file = path.join(__dirname, '../../../resources/templates/import-account-template.csv');
    res.download(file);
  } catch (error) {
    next(error);
  }
}

/**
 * @method importAccounts
 *
 * @description this method allow to do an import of accounts
 */
function importAccounts(req, res, next) {
  const params = util.convertStringToNumber(req.query);

  if (params.option !== IMPORT_DEFAULT_OHADA_ACCOUNTS && (!req.files || req.files.length === 0)) {
    const errorDescription = 'Expected at least one file upload but did not receive any files.';
    const errorDetails = new BadRequest(errorDescription, 'ERRORS.MISSING_UPLOAD_FILES');
    next(errorDetails);
    return;
  }

  const file = req.files[0];
  const dbPromises = [];

  if (params.option === IMPORT_DEFAULT_OHADA_ACCOUNTS || params.option === IMPORT_CUSTOM_OHADA_ACCOUNTS) {
    const basicAccountFile = path.join(__dirname, '../../../resources/templates/ohada-main-accounts.csv');
    dbPromises.push(importAccountFromFile(basicAccountFile, req.session.enterprise.id, params.option));
  }

  if (params.option === IMPORT_CUSTOM_OHADA_ACCOUNTS || params.option === IMPORT_OTHER_ACCOUNTS) {
    dbPromises.push(importAccountFromFile(file.path, req.session.enterprise.id, params.option));
  }

  Promise.all(dbPromises)
    .then(() => res.sendStatus(201))
    .catch(next);

}

/**
 * @method importAccountFromFile
 * @description import accounts from a given file
 * @param {object} file the file object
 * @param {number} enterpriseId the enterprise id
 * @param {number} option the option (1 | 2 | 3) sent by the client
 */
function importAccountFromFile(filePath, enterpriseId, option) {
  return util.formatCsvToJson(filePath)
    .then(data => {
      if (!hasValidDataFormat(data)) {
        throw new BadRequest('The given file has a bad data format for accounts', 'ERRORS.BAD_DATA_FORMAT');
      }

      const transaction = db.transaction();

      data.forEach(item => {
        const query = 'CALL ImportAccount(?, ?, ?, ?, ?, ?);';
        const queryParams = [
          enterpriseId,
          Number.parseInt(item.account_number, 10),
          item.account_label,
          item.account_type,
          Number.parseInt(item.account_parent, 10) || null,
          option,
        ];
        transaction.addQuery(query, queryParams);
      });

      return transaction.execute();
    });
}

/**
 * hasValidDataFormat
 *
 * @description check if data has a valid format for accounts
 *
 * @param {object} data
 */
function hasValidDataFormat(data = []) {
  return data.every(item => {
    return item.account_number && item.account_label && item.account_type;
  });
}
