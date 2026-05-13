const TU = require('./TestUtils');
const GU = require('./GridUtils');

/**
 * clickOnMethod
 * @description click on a dropdown button in a grid
 * @param {number} rowIndex - the index of the row
 * @param {number} colIndex - the index of the column
 * @param {string} actionType - the data-method type of the element
 * @param {string} gridId - the grid identifier
 * @returns {Promise} of the click on the method
 */
async function clickOnMethod(rowIndex, colIndex, actionType, gridId) {

  // Open the action menu
  const actionCell = await GU.getCell(gridId, rowIndex, colIndex);
  await actionCell.locator('[data-method="action"]').click();

  // Click on the desired action button
  const actionButton = await TU.locator(`[data-action="${rowIndex}"] a[data-method="${actionType}"]`);
  return actionButton.click();
}

module.exports.clickOnMethod = clickOnMethod;
