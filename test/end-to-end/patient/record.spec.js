const path = require('path');
const moment = require('moment');

const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const components = require('../shared/components');
const FillFormManagement = require('../fillForm/fillForm.page');
// path to the fixtures directory
const fixtures = path.resolve(__dirname, '../../fixtures/');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Patient Record', () => {
  const root = '#!/patients/';
  const id = '274c51ae-efcc-4238-98c6-f402bfb39866';
  const fillForm = new FillFormManagement();

  const patient = {
    name : 'Test 2 Patient',
    id : 'PA.TPA.2',
    hospital_no : '110',
    dob : '1990-06-01',
    gender : 'M',
  };

  const age = (dob) => `${moment().diff(dob, 'years')}`;
  const url = root.concat(id);

  const dataMedicalSheet = {
    choice_list_id : 'Paracetamol500 mg',
    poids : 68.9,
    dosekilos : 1,
    nombreFois : 3,
    voie : 'Orale',
    date : '1986-09-07',
    temps : '03:16',
    hours : '15',
    minutes : '00',
  };

  test.beforeEach(async () => {
    await TU.navigate(url);
    await TU.waitForSelector('bh-patient-medical-sheet');
  });

  test(`View and complete a patient's medical sheet`, async () => {
    await TU.locator(by.id('form_1')).click();
    await fillForm.fillPatientSheet(dataMedicalSheet);
  });

  test('downloads and correctly displays patient information', async () => {
    await TU.hasText(by.id('name'), patient.name);
    await TU.hasText(by.id('patientID'), patient.id);
    await TU.hasText(by.id('hospitalNo'), patient.hospital_no);
    await TU.hasText(by.id('age'), age(patient.dob));
    await TU.hasText(by.id('gender'), patient.gender);
  });

  // sub unit tests - these can be moved to individual files if they become too large
  test('displays the correct number of patient visits', async () => {
    const visits = await TU.locator('tr[data-visit-line]').all();
    expect(visits.length).toBe(1);
  });

  test('admits a patient', async () => {
    const diagnosisLabel = 'Melioidose a';

    await TU.locator(by.id('submit-visit')).click();

    await components.serviceSelect.set('Medecine Interne');
    await components.diagnosisSelect.set(diagnosisLabel);
    await TU.modal.submit();
    await components.notification.hasSuccess();

    // Reload the page
    await TU.navigate(url);
    await TU.waitForSelector('bh-patient-medical-sheet');

    // check to see a new visit has been added
    const visits = await TU.locator('tr[data-visit-line]').all();
    expect(visits.length).toBe(2);
  });

  test('dicharges a patient with a new diagnosis', async () => {
    const diagnosisLabel = 'Melioidose a';

    await TU.locator(by.id('submit-visit')).click();

    await TU.input('AdmitCtrl.visit.notes', 'Patient discharge has optional notes.');

    await components.diagnosisSelect.set(diagnosisLabel);
    await TU.modal.submit();
    await TU.waitForSelector('bh-patient-medical-sheet');

    // this is part of the same visit so expect no difference in number of visits
    const visits = await TU.locator('tr[data-visit-line]').all();
    expect(visits.length).toBe(0);
  });

  // Upload patient documents
  test('upload a valid image as document', async () => {
    const title = '[e2e] New Image As Document';
    const fileToUpload = 'file.jpg';
    const absolutePath = path.resolve(fixtures, fileToUpload);

    await TU.locator('[data-document-action="add"]').click();

    await TU.input('$ctrl.title', title);
    await TU.uploadFile(absolutePath, by.model('$ctrl.file'));

    await TU.modal.submit();
    await components.notification.hasSuccess();
  });

  // upload patient documents
  test('upload a PDF document', async () => {
    const title = '[e2e] New Document';
    const fileToUpload = 'file.pdf';
    const absolutePath = path.resolve(fixtures, fileToUpload);

    await TU.locator('[data-document-action="add"]').click();
    await TU.input('$ctrl.title', title);
    await TU.uploadFile(absolutePath, by.model('$ctrl.file'));

    await TU.modal.submit();
    await components.notification.hasSuccess();
  });

  // test invalid file upload
  test('cannot upload invalid document', async () => {
    const title = '[e2e] Invalid Document';
    const fileToUpload = 'file.virus';
    const absolutePath = path.resolve(fixtures, fileToUpload);

    await TU.locator('[data-document-action="add"]').click();

    await TU.input('$ctrl.title', title);
    await TU.uploadFile(absolutePath, by.model('$ctrl.file'));

    await TU.exists('[data-error-message]', true);
    await TU.modal.close();
  });

  // change document view
  test('change document view', async () => {
    await TU.locator('[data-document-action="thumbnail"]').click();
    await TU.exists('[data-view="thumbnail"]', true);

    await TU.locator('[data-document-action="list"]').click();
    await TU.exists('[data-view="list"]', true);
  });

  test(' thumbnail should not be shown if the upload is not an image', async () => {
    const title = '[e2e] New pdf As Document';
    const fileToUpload = 'file.pdf';
    const absolutePath = path.resolve(fixtures, fileToUpload);

    await TU.locator('[data-document-action="add"]').click();

    await TU.input('$ctrl.title', title);
    await TU.uploadFile(absolutePath, by.model('$ctrl.file'));
    await TU.exists(by.id('upload_thumbnail'), false);
    await TU.modal.close();
  });

  // @TODO: Fix.  Works alone but fails with other tests
  test.skip('Should check if upload_thumbnail is displayed if the upload is an image', async () => {
    const title = '[e2e] New Image As Document';
    const fileToUpload = 'file.jpg';
    const absolutePath = path.resolve(fixtures, fileToUpload);

    await TU.locator('[data-document-action="add"]').click();

    await TU.input('$ctrl.title', title);
    await TU.uploadFile(absolutePath, by.model('$ctrl.file'));
    await TU.exists(by.id('upload_thumbnail'), true);
    await TU.modal.close();
  });

  test('informs the user that there is no patient for invalid request', async () => {
    await TU.navigate(root.concat('invalidid'));
    await components.notification.hasError();
    await TU.exists(by.id('nopatient'), true);
  });
});
