const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const components = require('../shared/components');
const GridRow = require('../shared/GridRow');

/**
 * This class is represents an employee registration page
 * behaviour so it is an employee page object
 */

class RegistrationPage {
  async editEmployee(reference) {
    const row = new GridRow(reference);
    await row.dropdown();
    await row.edit();
  }

  createEmployee() {
    return TU.buttons.submit();
  }

  // set display name
  setDisplayName(displayName) {
    return TU.input('EmployeeCtrl.employee.display_name', displayName);
  }

  // set dob
  setDob(dob) {
    return TU.input('EmployeeCtrl.employee.dob', dob);
  }

  // set sex
  setSex(sex) {
    const id = (sex === 'M') ? 'male' : 'female';
    return TU.locator(by.id(id)).click();
  }

  // set number of spouse
  setNumberChild(nbEnfant) {
    return TU.input('EmployeeCtrl.employee.nb_enfant', nbEnfant);
  }

  // set hiring date
  setHiringDate(hiringDate) {
    return TU.input('EmployeeCtrl.employee.hiring_date', hiringDate);
  }

  // set the employee code
  setCode(code) {
    return TU.input('EmployeeCtrl.employee.code', code);
  }

  // set service
  setService(service) {
    return TU.uiSelect('EmployeeCtrl.employee.service_uuid', service);
  }

  // set grade
  setGrade(grade) {
    return TU.uiSelect('EmployeeCtrl.employee.grade_uuid', grade);
  }

  // set fonction
  setFunction(fonction) {
    return TU.uiSelect('EmployeeCtrl.employee.fonction_id', fonction);
  }

  // set email
  setEmail(email) {
    return TU.input('EmployeeCtrl.employee.email', email);
  }

  // set address
  setAddress(address) {
    return TU.input('EmployeeCtrl.employee.adresse', address);
  }

  // set hospital Number
  setHospitalNumber(hn) {
    return TU.input('EmployeeCtrl.employee.hospital_no', hn);
  }

  // set debtor group
  setDebtorGroup(dg) {
    return components.debtorGroupSelect.set(dg);
  }

  // set creditor group
  setCreditorGroup(cg) {
    return TU.uiSelect('EmployeeCtrl.employee.creditor_group_uuid', cg);
  }

  // Set Currency Input
  setCurrencyInput(id, value) {
    return components.currencyInput.set(value, id);
  }

  // set bank
  setBank(bank) {
    return TU.input('EmployeeCtrl.employee.bank', bank);
  }

  // set bank account
  setBankAccount(bankAccount) {
    return TU.input('EmployeeCtrl.employee.bank_account', bankAccount);
  }

  // Set RubricPayroll defined value By Employee
  async setRubricPayroll(rubrics) {
    const keys = Object.keys(rubrics);

    // eslint-disable-next-line
    for (const key of keys) {
      // eslint-disable-next-line
      await TU.locator(by.id(key)).sendKeys(rubrics[key]);
    }
  }

  // set origin location
  setOriginLocation(locations) {
    return components.locationSelect.set(locations, 'origin-location-id');
  }

  // set current location
  setCurrentLocation(locations) {
    return components.locationSelect.set(locations, 'current-location-id');
  }

  isEmployeeCreated(resp) {
    return TU.exists(by.id('receipt-confirm-created'), resp);
  }

  expectNotificationSuccess() {
    return components.notification.hasSuccess();
  }

  async requiredFieldErrored() {
    await TU.validation.error('EmployeeCtrl.employee.display_name');
    await TU.validation.error('EmployeeCtrl.employee.code');
    await TU.validation.error('EmployeeCtrl.employee.grade_uuid');
    await TU.validation.error('EmployeeCtrl.employee.creditor_group_uuid');
    await TU.validation.error('$ctrl.debtorGroupUuid');
    await TU.validation.error('EmployeeCtrl.employee.dob');
    await TU.validation.error('EmployeeCtrl.employee.hospital_no');
  }

  async notRequiredFieldOk() {
    await TU.validation.ok('EmployeeCtrl.employee.nb_enfant');
    await TU.validation.ok('EmployeeCtrl.employee.phone');
    await TU.validation.ok('EmployeeCtrl.employee.email');
    await TU.validation.ok('EmployeeCtrl.employee.bank');
    await TU.validation.ok('EmployeeCtrl.employee.bank_account');
    await TU.validation.ok('EmployeeCtrl.employee.service_uuid');
    await TU.validation.ok('EmployeeCtrl.employee.fonction_id');
    await TU.validation.ok('EmployeeCtrl.employee.adresse');
  }
}

module.exports = RegistrationPage;
