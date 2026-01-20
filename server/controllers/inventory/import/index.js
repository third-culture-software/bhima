/**
 * @overview Inventory Import Module
 *
 * This module implements the logic for importing the inventory into the application.  It provides
 * a template file to show how the inventory schema must be modeled for the user to fill out.
 */
const path = require('path');
const debug = require('debug')('bhima:inventory');
const db = require('../../../lib/db');
const util = require('../../../lib/util');
const BadRequest = require('../../../lib/errors/BadRequest');

exports.downloadTemplate = downloadTemplate;
exports.importInventories = importInventories;

/**
 * @method downloadTemplate
 *
 * @description send to the client the template file for inventory import
*/
async function downloadTemplate(req, res) {
  const file = path.join(__dirname, '../../../resources/templates/import-inventory-template.csv');
  res.download(file);
}

/**
 * @method importInventories
 *
 * @description this method allow to do an import of inventory and stock
 */
async function importInventories(req, res) {
  if (!req.files || req.files.length === 0) {
    throw new BadRequest('Expected at least one file upload but did not receive any files.',
      'ERRORS.MISSING_UPLOAD_FILES');
  }

  const filePath = req.files[0].path;

  const data = await util.formatCsvToJson(filePath);

  if (!hasValidHeaders(data)) {
    throw new BadRequest('The given file has a bad column headers inventories',
      'INVENTORY.INVENTORY_IMPORT_BAD_HEADERS');
  }

  if (!hasValidData(data)) {
    throw new BadRequest('The given file has missing data for some inventories',
      'INVENTORY.INVENTORY_IMPORT_ERROR');
  }

  const transaction = db.transaction();
  const query = 'CALL ImportInventory(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';

  data.forEach(item => {
    const queryParams = [
      req.session.enterprise.id,
      item.inventory_group_name,
      item.inventory_code,
      item.inventory_text,
      item.inventory_type,
      item.inventory_unit,
      item.inventory_unit_price,
      item.inventory_consumable || 1,
      item.inventory_is_asset || 0,
      item.depreciation_rate || 0,
      item.inventory_brand || null,
      item.inventory_model || null,
      item.tag || '',
    ];

    transaction.addQuery(query, queryParams);
  });

  await transaction.execute();
  res.sendStatus(200);
}

/**
 * @function hasValidHeaders
 *
 * @description check if data has a valid format for inventories
 *
 * @param {Array} data - array of objects to check for valid properties
 *
 * @returns {boolean} - true if data is valid
 */
function hasValidHeaders(data = []) {
  const [headers] = data;
  return 'inventory_group_name' in headers && 'inventory_code' in headers
    && 'inventory_text' in headers && 'inventory_type' in headers
    && 'inventory_unit' in headers && 'inventory_unit_price' in headers;
}

/**
 * @function hasValidData
 *
 * @description check if data has a valid format for inventories
 *
 * @param {Array} data - array of objects to check for valid properties
 *
 * @returns {boolean} - true if data is valid
 */
function hasValidData(data = []) {
  return data.every(item => {
    const bool = item.inventory_code && item.inventory_group_name
      && item.inventory_text && item.inventory_type && item.inventory_unit
      && item.inventory_unit_price;
    if (!bool) {
      debug('#import(): invalid data format:', item);
    }

    return bool;
  });
}
