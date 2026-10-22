/**
 * Stock Import Module
 *
 * This module is responsible of handling the import of stock
 * and related stock quantities
 */
const path = require('path');
const moment = require('moment');

const db = require('../../lib/db');
const util = require('../../lib/util');
const BadRequest = require('../../lib/errors/BadRequest');
const Fiscal = require('../finance/fiscal');
const getTranslationHelper = require('../../lib/helpers/translate');

exports.downloadTemplate = downloadTemplate;
exports.importStock = importStock;

const IMPORT_QUERY = 'CALL ImportStock(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
const IS_EXIT = 0;

/**
 * @param req
 * @param res
 * @function downloadTemplate
 * @description send to the client the template file for stock import
 */
function downloadTemplate(req, res) {
  const file = path.join(__dirname, '../../resources/templates/import-stock-template.csv');
  res.download(file);
}

/**
 * @param req
 * @param res
 * @function importStock
 * @description this method allow to do an import of stock and their lots
 */
async function importStock(req, res) {
  const operationDate = new Date(req.body.date);
  const filePath = req.files[0].path;
  const depotUuid = db.bid(req.body.depot_uuid);
  const documentUuid = db.bid(util.uuid());

  const [, period, data ] = await Promise.all([
    // check if a depot exists for the given uuid
    db.one('SELECT uuid FROM depot WHERE uuid = ?', depotUuid),
    // get the fiscal year period information
    Fiscal.lookupFiscalYearByDate(operationDate),
    // read the csv file
    util.formatCsvToJson(filePath),
  ]);

  // check validity of all data from the csv file
  checkDataFormat(data);

  const transaction = db.transaction();

  data.forEach(item => {
    transaction.addQuery(IMPORT_QUERY, [
      moment(operationDate).format('YYYY-MM-DD'),
      req.session.enterprise.id,
      req.session.project.id,
      req.session.user.id,
      depotUuid,
      documentUuid,
      item.inventory_group_name,
      item.inventory_code || '',
      item.inventory_text,
      item.inventory_type,
      item.inventory_unit,
      item.inventory_unit_price,
      item.inventory_cmm || 0.0,
      item.inventory_consumable || 1,
      item.inventory_is_asset || 0,
      item.inventory_brand || null,
      item.inventory_model || null,
      item.stock_lot_label,
      item.stock_lot_quantity,
      moment(item.stock_lot_expiration).format('YYYY-MM-DD'),
      item.stock_serial_number || null,
      moment(item.acquisition_date || new Date()).format('YYYY-MM-DD'),
      item.stock_funding_source,
      item.depreciation_rate || 0,
      period.id,
    ]);
  });

  if (req.session.stock_settings.enable_auto_stock_accounting) {
    transaction.addQuery('CALL PostStockMovement(?)', [[documentUuid, IS_EXIT, req.session.project.id]]);
  }

  await transaction.execute();
  res.sendStatus(201);
}

const isFilledString = value => typeof value === 'string' && value.length > 0;
const isValidDate = value => isFilledString(value) && moment(value).isValid();
const isNumeric = value => value !== '' && value != null && Number.isFinite(Number(value));
const isOptionalNumeric = value => value === '' || value == null || isNumeric(value);

/**
 * Validation rules, checked in order: [field, translation key, validator]
 */
const RULES = [
  ['inventory_group_name', 'ER_BAD_INVENTORY_GROUP', isFilledString],
  ['inventory_text', 'ER_BAD_INVENTORY_TEXT', isFilledString],
  ['inventory_type', 'ER_BAD_INVENTORY_TYPE', isFilledString],
  ['inventory_unit', 'ER_BAD_INVENTORY_UNIT', isFilledString],
  ['stock_lot_label', 'ER_BAD_LOT_LABEL', isFilledString],
  ['stock_lot_expiration', 'ER_BAD_EXPIRATION_DATE', isValidDate],
  ['inventory_consumable', 'ER_BAD_INVENTORY_CONSUMABLE', isOptionalNumeric],
  ['inventory_is_asset', 'ER_BAD_INVENTORY_ASSET', isOptionalNumeric],
  ['inventory_unit_price', 'ER_BAD_INVENTORY_UNIT_PRICE', isNumeric],
  ['stock_lot_quantity', 'ER_BAD_LOT_QUANTITY', isNumeric],
];

/**
 * @function checkDataFormat
 * @description throws a translated BadRequest on the first invalid csv row
 * @param {object[]} data
 */
function checkDataFormat(data = []) {
  const t = getTranslationHelper('en');

  data.forEach((item, index) => {
    const failed = RULES.find(([field,, isValid]) => !isValid(item[field]));
    if (!failed) { return; }

    const [field, key] = failed;
    const msg = t(`ERRORS.${key}`)
      .replace('%line%', index + 2)
      .replace('%value%', item[field] ?? '');

    throw new BadRequest(msg, msg);
  });
}

