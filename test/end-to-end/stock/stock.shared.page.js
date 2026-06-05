const path = require('path');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const fixtures = path.resolve(__dirname, '../../fixtures/');

/**
 * @param action
 * @function selectDropdownAction
 * @description
 * This function selects an option from the menu at the top of the stock modules.
 */
async function selectDropdownAction(action) {
  // open the dropdown menu
  await TU.locator('[data-action="open-tools"]').click();

  // get the action and click it
  return TU.locator(`[data-action="${action}"]`).click();
}

/**
 * @function ensureModalIsOpen
 * @description
 * Makes sure that the modal is either already open or opens it.
 * @TODO (@jniles) This isn't great practice ... it probably should be re-examined
 * if tests should have conditionals like this.
 */
async function ensureModalIsOpen() {
  if (await TU.isPresent('[data-depot-selection-modal]')) {
    return true;
  }

  return selectDropdownAction('change-depot');
}

/**
 * @param label
 * @function setDepot
 * @description
 * Uses the helper methods to set the depot on all pages.
 */
async function setDepot(label) {
  await ensureModalIsOpen();

  // Make sure the menu of depots is fully loaded and showing
  await TU.waitForSelector('li.list-group-item');
  const depot = await TU.locator(`li.list-group-item:has-text("${label}")`);
  await depot.click();

  return TU.modal.submit();
}

/**
 * @param fileToUpload
 * @param elementId
 * @function uploadFile
 * @description
 * Use this helper method to use an input type file for uploading
 * a file
 */
async function uploadFile(fileToUpload, elementId = 'import-input') {
  const absolutePath = path.resolve(fixtures, fileToUpload);
  return TU.uploadFile(absolutePath, by.id(elementId));
}

// make this available to all modules
module.exports = {
  setDepot,
  uploadFile,
};
