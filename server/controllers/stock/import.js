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

/**
 * @method downloadTemplate
 *
 * @description send to the client the template file for stock import
*/
function downloadTemplate(req, res, next) {
  try {
    const file = path.join(__dirname, '../../resources/templates/import-stock-template.csv');
    res.download(file);
  } catch (error) {
    next(error);
  }
}

/**
 * @method importStock
 *
 * @description this method allow to do an import of stock and their lots
 */
async function importStock(req, res, next) {
  let queryParams;

  const operationDate = new Date(req.body.date);
  const filePath = req.files[0].path;
  const depotUuid = db.bid(req.body.depot_uuid);
  const documentUuid = db.bid(util.uuid());

  try {
    // check if a depot exists for the given uuid
    await db.one('SELECT uuid FROM depot WHERE uuid = ?', depotUuid);

    // get the fiscal year period information
    const period = await Fiscal.lookupFiscalYearByDate(operationDate);

    // read the csv file
    const data = await util.formatCsvToJson(filePath);

    // check validity of all data from the csv file
    checkDataFormat(data);

    const transaction = db.transaction();
    const query = 'CALL ImportStock(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';

    data.forEach(item => {

      queryParams = [
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
      ];
      transaction.addQuery(query, queryParams);
    });

    const isExit = 0;
    const postingParams = [documentUuid, isExit, req.session.project.id];

    if (req.session.stock_settings.enable_auto_stock_accounting) {
      transaction.addQuery('CALL PostStockMovement(?)', [postingParams]);
    }

    await transaction.execute();
    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
}

/**
 * checkDataFormat
 *
 * @description check if data has a valid format for stock
 *
 * @param {object} data
 */
function checkDataFormat(data = []) {
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const isInventoryGroupDefined = typeof (item.inventory_group_name) === 'string'
      && item.inventory_group_name.length > 0;
    const isInventoryTextDefined = typeof (item.inventory_text) === 'string' && item.inventory_text.length > 0;
    const isInventoryTypeDefined = typeof (item.inventory_type) === 'string' && item.inventory_type.length > 0;
    const isInventoryUnitDefined = typeof (item.inventory_unit) === 'string' && item.inventory_unit.length > 0;
    const isStockLotLabelDefined = typeof (item.stock_lot_label) === 'string' && item.stock_lot_label.length > 0;
    const isExpirationDefined = typeof (item.stock_lot_expiration) === 'string' && item.stock_lot_expiration.length > 0;
    const isInventoryConsumableNumber = !Number.isNaN(Number(item.inventory_consumable));
    const isInventoryIsAssetNumber = !Number.isNaN(Number(item.inventory_is_asset));
    const isUnitPriceNumber = !Number.isNaN(Number(item.inventory_unit_price));
    const isLotQuantityNumber = !Number.isNaN(Number(item.stock_lot_quantity));

    /**
     * The key parameter of BadRequest must be properly translated for the user
     */
    const t = getTranslationHelper('en');
    let msg;
    let msgFormatted;

    if (!isInventoryGroupDefined) {
      msg = t('ERRORS.ER_BAD_INVENTORY_GROUP');
      msgFormatted = msg.replace('%line%', i + 2).replace('%value%', item.inventory_group_name);
      throw new BadRequest(msgFormatted, msgFormatted);
    }

    if (!isInventoryTextDefined) {
      msg = t('ERRORS.ER_BAD_INVENTORY_TEXT');
      msgFormatted = msg.replace('%line%', i + 2).replace('%value%', item.inventory_text);
      throw new BadRequest(msgFormatted, msgFormatted);
    }

    if (!isInventoryTypeDefined) {
      msg = t('ERRORS.ER_BAD_INVENTORY_TYPE');
      msgFormatted = msg.replace('%line%', i + 2).replace('%value%', item.inventory_type);
      throw new BadRequest(msgFormatted, msgFormatted);
    }

    if (!isInventoryUnitDefined) {
      msg = t('ERRORS.ER_BAD_INVENTORY_UNIT');
      msgFormatted = msg.replace('%line%', i + 2).replace('%value%', item.inventory_unit);
      throw new BadRequest(msgFormatted, msgFormatted);
    }

    if (!isStockLotLabelDefined) {
      msg = t('ERRORS.ER_BAD_LOT_LABEL');
      msgFormatted = msg.replace('%line%', i + 2).replace('%value%', item.stock_lot_label);
      throw new BadRequest(msgFormatted, msgFormatted);
    }

    if (!isExpirationDefined) {
      msg = t('ERRORS.ER_BAD_EXPIRATION_DATE');
      msgFormatted = msg.replace('%line%', i + 2).replace('%value%', item.stock_lot_expiration);
      throw new BadRequest(msgFormatted, msgFormatted);
    }

    if (!isInventoryConsumableNumber) {
      msg = t('ERRORS.ER_BAD_INVENTORY_CONSUMABLE');
      msgFormatted = msg.replace('%line%', i + 2).replace('%value%', item.inventory_consumable);
      throw new BadRequest(msgFormatted, msgFormatted);
    }

    if (!isInventoryIsAssetNumber) {
      msg = t('ERRORS.ER_BAD_INVENTORY_ASSET');
      msgFormatted = msg.replace('%line%', i + 2).replace('%value%', item.inventory_is_asset);
      throw new BadRequest(msgFormatted, msgFormatted);
    }
    if (!isUnitPriceNumber) {
      msg = t('ERRORS.ER_BAD_INVENTORY_UNIT_PRICE');
      msgFormatted = msg.replace('%line%', i + 2).replace('%value%', item.inventory_unit_price);
      throw new BadRequest(msgFormatted, msgFormatted);
    }

    if (!isLotQuantityNumber) {
      msg = t('ERRORS.ER_BAD_LOT_QUANTITY');
      msgFormatted = msg.replace('%line%', i + 2).replace('%value%', item.stock_lot_quantity);
      throw new BadRequest(msgFormatted, msgFormatted);
    }
  }
}
