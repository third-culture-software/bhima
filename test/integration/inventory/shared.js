/**
 * This file contains shared information between all inventory
 * elements (metadata, groups, types, unit, ...)
 */

const helpers = require('../helpers');

const inventoryGroup = {
  uuid : helpers.uuid(),
  code : '99',
  name : 'Test Inventory Group 2',
  stock_account : 162, // 31110010 - 'Medicaments en comprimes *'
  sales_account : 242, // 70111010 - Vente Medicaments en comprimes
  cogs_account : 209, // 60310010 - Médicaments en comprimés
  tracking_expiration : 1,
  unique_item : 0,
  depreciation_rate : 0,
};

const updateGroup = {
  code : '111',
  name : 'Updated Inventory Group',
  stock_account : 163, // 31110011 - Medicaments en Sirop *
  sales_account : 242, // 70111010 - Vente Medicaments en comprimes
  cogs_account : 209, // 60310010 - Médicaments en comprimés
  unique_item : 0,
  tracking_expiration : 1,
  tracking_consumption : 0,
  depreciation_rate : 10,
};

const inventoryType = {
  text : '[Test] Article Laboratoire',
};

const updateInventoryType = {
  text : '[Test] Article Chirurgie',
  description : 'Description de l\'article chirurgie',
  is_predefined : 0,
};

const inventoryUnit = {
  text : '[Test] Comprimés',
  abbr : 'TC',
  token : null,
};

const updateUnit = {
  text : '[Test] Gellule',
  abbr : 'TG',
  token : null,
};

module.exports = {
  inventoryGroup,
  updateGroup,
  inventoryType,
  updateInventoryType,
  inventoryUnit,
  updateUnit,
};
