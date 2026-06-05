const TU = require('../shared/TestUtils');
const GU = require('../shared/GridUtils');

/**
 *
 */
function PatientMergePage() {
  const page = this;
  const gridId = 'patient-registry';

  page.gridId = gridId;

  page.openMergeTool = async function openMergeTool() {
    await TU.locator('[data-action="open-tools"]').click();
    return TU.locator('[data-method="merge-patient"]').click();
  };

  page.gridSelectRows = async function gridSelectRows(...lines) {
    for (const line of lines) {  
      await GU.selectRow(gridId, line);  
    }
    return true;
  };

  page.selectPatientToKeep = function selectPatientToKeep(reference) {
    return TU.locator(`[data-reference="${reference}"]`).click();
  };

  page.merge = function merge() {
    return TU.buttons.submit();
  };
}

module.exports = PatientMergePage;
