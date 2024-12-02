const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');
const components = require('../shared/components');

/**
 * This class is represents a visit page in term of structure and
 * behaviour so it is a visit page object
 */
class VisitPage {

  constructor() {
    this.gridId = 'visit-grid';
  }

  /**
   * send back the number of visits in the grid
   */
  async expectNumberOfGridRows(number) {
    // Make sure the grid is loaded first
    await TU.waitForSelector('.ui-grid-grid-footer');
    await GU.expectRowCount(this.gridId, number, `Expected Visit Registry's ui-grid row count to be ${number}.`);
  }

  /**
   * create visit success
   */
  async createVisitSuccess(
    patientName, serviceName, diagnosis, note, isHospitalized, isOldCase,
    isPregnant, notInsideHealthZone, isRefered, ward, room) {
    await this.createVisit(
      patientName, serviceName, diagnosis, note, isHospitalized, isOldCase,
      isPregnant, notInsideHealthZone, isRefered, ward, room);

    await components.notification.hasSuccess();
  }

  /**
   * create visit fail
   */
  async createVisitFail(
    patientName, serviceName, diagnosis, note, isHospitalized, isOldCase,
    isPregnant, notInsideHealthZone, isRefered, ward, room) {
    await this.createVisit(
      patientName, serviceName, diagnosis, note, isHospitalized, isOldCase,
      isPregnant, notInsideHealthZone, isRefered, ward, room);
    const warningAdmittedTag = '[data-patient-already-admitted]';
    await TU.exists(warningAdmittedTag, true);
    await TU.buttons.cancel();
    await components.notification.hasDanger();
  }

  /**
   * create visit
   */
  async createVisit(
    patientName, serviceName, diagnosis, note, isHospitalized, isOldCase,
    isPregnant, notInsideHealthZone, isRefered, ward, room) {
    await TU.buttons.create();

    // Wait for the modal to come up
    await TU.waitForSelector('.modal-dialog');

    // choose the patient
    await components.findPatient.findByName(patientName);

    // choose the service
    await components.serviceSelect.set(serviceName);

    // select diagnosis
    if (diagnosis) {
      await components.diagnosisSelect.set(diagnosis);
    }

    // set note
    await TU.input('AdmitCtrl.visit.notes', note || '');

    if (isHospitalized) {
      await TU.radio('AdmitCtrl.visit.hospitalized', 1);
    }

    if (isOldCase) {
      await TU.radio('AdmitCtrl.visit.is_new_case', 1);
    }

    if (isPregnant) {
      await components.yesNoRadios.set('yes', 'patient-is-pregnant');
    }

    if (isRefered) {
      await components.yesNoRadios.set('yes', 'patient-is-refered');
    }

    if (notInsideHealthZone) {
      await TU.radio('AdmitCtrl.visit.inside_health_zone', 1);
    }

    if (ward) {
      await components.wardSelect.set(ward);
    }

    if (room) {
      await components.roomSelect.set(room);
    }

    await TU.buttons.submit();
  }

  /**
   * search
   */
  async search(options) {
    await TU.buttons.search();

    // set to default values the form
    await this.reset();

    if (options.isRefered) {
      await TU.locator(by.model('$ctrl.searchQueries.is_refered')).check();
    }

    if (options.isPregnant) {
      await components.yesNoRadios.set('yes', 'patient-is-pregnant');
    }

    // hospitalization
    if (options.isHospitalized === 1) {
      await TU.locator(by.id('hospitalized_yes')).check();
    }

    if (options.isHospitalized === 0) {
      await TU.locator(by.id('hospitalized_no')).check();
    }

    // new case
    if (options.isNewCase === 1) {
      await TU.locator(by.id('is_new_case_yes')).check();
    }

    if (options.isNewCase === 0) {
      await TU.locator(by.id('is_new_case_no')).check();
    }

    // inside health zone
    if (options.insideHealthZone === 1) {
      await TU.locator(by.id('inside_health_zone_yes')).check();
    }

    if (options.insideHealthZone === 0) {
      await TU.locator(by.id('inside_health_zone_no')).check();
    }

    if (options.displayName) {
      await TU.input('$ctrl.searchQueries.display_name', options.displayName);
    }

    if (options.reference) {
      await TU.input('$ctrl.searchQueries.reference', options.reference);
    }

    if (options.hospital_no) {
      await TU.input('$ctrl.searchQueries.hospital_no', options.hospital_no);
    }

    if (options.service) {
      await components.serviceSelect.set(options.service);
    }

    if (options.ward) {
      await components.wardSelect.set(options.ward);
    }

    if (options.room) {
      await components.roomSelect.set(options.room);
    }

    await TU.buttons.submit();
  }

  /**
   * reset
   */
  async reset() {
    const clearButtons = await TU.locator('[data-reset-input]').all();

    // start clearing from the bottom to the top
    // because if the clean start from the top and arrive in the bottom,
    // top elements are not visible
    for (let i = clearButtons.length - 1; i >= 0; i--) {
      const clearBtn = clearButtons[i];
      await clearBtn.click(); // eslint-disable-line no-await-in-loop
    }
  }
}

module.exports = VisitPage;
