/**
 * Modal Action component interface for e2e test
 * @public
 */

const TU = require('../TestUtils');

module.exports = {

  confirm : async function confirm() {
    // This function is called when the test requires
    // a click on the button confirms the modal window
    const submit = await TU.locator('[data-confirm-modal] [data-method="submit"]');
    return submit.click();
  },

  dismiss : async function dismiss() {
    // This function is called when the test requires
    // a click on the button cancel for dismiss the action
    const cancel = await TU.locator('[data-confirm-modal] [data-method="cancel"]');
    return cancel.click();
  },
};
