const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const helpers = require('../shared/helpers');

const RegistrationPage = require('./registration.page');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Employees', () => {
  const path = '/#!/employees/register';
  const registrationPage = new RegistrationPage();
  const employee = {
    code          : 'HBB80',
    display_name  : 'Dedrick Kitamuka',
    sex          : 'M',
    dob           : '30/06/1960',
    hiring_date : '17/05/1997',
    nb_enfant     : 2,
    bank          : 'BIAC',
    bank_account  : '00-99-88-77',
    email         : 'me@info.com',
    adresse       : '221B Baker Street',
    hospital_no   : 'TP003',
  };

  const patient = {
    code           : 'HBB2018',
    display_name   : 'Test 1 Patient',
    hiring_date  : '24/11/1965',
    nb_spouse      : 5,
    nb_enfant      : 3,
    bank           : 'BCDC_1909',
    bank_account   : '00-99-100',
    email          : 'me@info.com',
    adresse        : '10011 B1-P455',
    debtor_group   : 'NGO IMA World Health',
    creditor_group : 'Employees',
  };

  const pathPatient = '/#!/employees/81AF634F321A40DEBC6FCEB1167A9F65/patientAsEmployee';

  test.beforeEach(async () => {
    await TU.navigate(path);
  });

  test('blocks invalid form submission with relevant error classes', async () => {
    // verify we are in the current path
    expect(await TU.getCurrentPath()).toBe(path);

    await registrationPage.createEmployee();
    await registrationPage.requiredFieldErrored();
    await registrationPage.notRequiredFieldOk();
  });

  test('creates a new employee', async () => {
    await registrationPage.setDisplayName(employee.display_name);
    await registrationPage.setDob(employee.dob);
    await registrationPage.setSex(employee.sex);
    await registrationPage.setCode(employee.code);
    await registrationPage.setGrade('1.1');
    await registrationPage.setHospitalNumber(employee.hospital_no);
    await registrationPage.setCreditorGroup('Employees');
    await registrationPage.setDebtorGroup('NGO IMA World Health');
    await registrationPage.setOriginLocation(helpers.data.locations);
    await registrationPage.setCurrentLocation(helpers.data.locations);
    await registrationPage.setHiringDate(employee.hiring_date);
    await registrationPage.setNumberChild(employee.nb_enfant);
    await registrationPage.setService('Administration');
    await registrationPage.setFunction('Infirmier');
    await registrationPage.setEmail(employee.email);
    await registrationPage.setAddress(employee.adresse);
    await registrationPage.setCurrencyInput('individual_salary', 0);

    await registrationPage.setCurrencyInput('TPR', 0);
    await registrationPage.setCurrencyInput('v_cher', 30);
    await registrationPage.setCurrencyInput('f_scol', 0);
    await registrationPage.setCurrencyInput('AL-FAM', 120);
    await registrationPage.setCurrencyInput('AC-SAL', 0);

    await registrationPage.setBank(employee.bank);
    await registrationPage.setBankAccount(employee.bank_account);

    await registrationPage.createEmployee();
    await TU.waitForSelector('#receipt-confirm-created');
    await registrationPage.isEmployeeCreated(true);
    await TU.buttons.close(); // Close the receipt modal
  });

  test('register an employee from a patient', async () => {
    await TU.navigate(pathPatient);
    await registrationPage.setCode(patient.code);
    await registrationPage.setGrade('1.1');
    await registrationPage.setCreditorGroup(patient.creditor_group);
    await registrationPage.setDebtorGroup(patient.debtor_group);
    await registrationPage.setHiringDate(patient.hiring_date);
    await registrationPage.setNumberChild(patient.nb_enfant);
    await registrationPage.setService('Administration');
    await registrationPage.setFunction('Infirmier');
    await registrationPage.setEmail(patient.email);
    await registrationPage.setAddress(patient.adresse);
    await registrationPage.setCurrencyInput('individual_salary', 0);
    await registrationPage.setCurrencyInput('TPR', 0);
    await registrationPage.setCurrencyInput('v_cher', 0);
    await registrationPage.setCurrencyInput('f_scol', 0);
    await registrationPage.setCurrencyInput('AL-FAM', 50);
    await registrationPage.setCurrencyInput('AC-SAL', 0);
    await registrationPage.setBank(patient.bank);
    await registrationPage.setBankAccount(patient.bank_account);

    await registrationPage.createEmployee();
    await registrationPage.expectNotificationSuccess();
  });
});
