const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const components = require('../shared/components');

/**
 * This class is represents a Survey Form page in term of structure and
 * behaviour so it is a Survey Form Management page object
 */

class FillFormManagementPage {
  constructor() {
    this.gridId = 'fill-form-grid';
    // this.rubricGrid = TU.locator(by.id(this.gridId));
    this.actionLinkColumn = 4;
  }

  /**
   * simulate the create Survey Form button click to show the dialog of creation
   * @param fillForm
   */
  async create(fillForm) {
    await TU.locator(by.id('form_3')).click();
    await TU.locator('[name="label"]').type(fillForm.label);
    await TU.locator('[name="longueur"]').type(fillForm.longueur.toString());
    await TU.locator('[name="largeur"]').type(fillForm.largeur.toString());
    await TU.locator('[name="nombre_agent"]').type(fillForm.nombre_agent.toString());
    await TU.locator('[name="nombre_femme"]').type(fillForm.nombre_femme.toString());
    await TU.locator('[name="raison"]').type(fillForm.raison);

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  async createComplexe(fillForm) {
    await TU.locator(by.id('form_1')).click();
    await components.findPatient.findByName(fillForm.patientName);
    await components.choiceListSelect.set(fillForm.choice_list_id, 'label');
    await TU.locator('[name="poids"]').type(fillForm.poids.toString());
    await TU.locator('[name="dosekilos"]').type(fillForm.dosekilos.toString());
    await TU.locator('[name="nombreFois"]').type(fillForm.nombreFois.toString());
    await components.dateEditor.set(new Date(fillForm.date), null, '.modal-dialog .title');
    await TU.locator('[name="voie"]').type(fillForm.voie);
    await TU.locator('[ng-model="hours"]').type(fillForm.hours.toString());
    await TU.locator('[ng-model="minutes"]').type(fillForm.minutes.toString());

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }

  async fillPatientSheet(fillForm) {
    await TU.locator(by.id('fill-form')).click();

    await components.choiceListSelect.set(fillForm.choice_list_id, 'label');
    await TU.locator('[name="poids"]').type(fillForm.poids.toString());
    await TU.locator('[name="dosekilos"]').type(fillForm.dosekilos.toString());
    await TU.locator('[name="nombreFois"]').type(fillForm.nombreFois.toString());
    await components.dateEditor.set(new Date(fillForm.date), null, '.modal-dialog .title');
    await TU.locator('[name="voie"]').type(fillForm.voie);
    await TU.locator('[ng-model="hours"]').type(fillForm.hours.toString());
    await TU.locator('[ng-model="minutes"]').type(fillForm.minutes.toString());

    await TU.buttons.submit();
    await components.notification.hasSuccess();
  }
}

module.exports = FillFormManagementPage;
