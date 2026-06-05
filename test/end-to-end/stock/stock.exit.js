const moment = require('moment');

const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const ExitPage = require('./stock.exit.page');

/**
 *
 */
function StockExitTests() {
  const DEPOT_PRINCIPAL = 'Depot Principal';
  const DEPOT_SECONDAIRE = 'Depot Secondaire';
  const PATIENT = 'PA.TPA.2';
  const INVOICE = 'IV.TPA.1';
  const SERVICE = 'Medecine Interne';
  const DESCRIPTION = 'Sortie de stock';

  const requisitionService = {
    service : 'Test Service',
    reference : 'SREQ.TPA.1',
  };

  const requisitionDepot = {
    depot : 'Depot Secondaire',
    reference : 'SREQ.TPA.2',
  };

  const preventRequisitionDepot = {
    depot : 'Depot Tertiaire',
    reference : 'SREQ.TPA.3',
    className : 'label-danger',
  };

  const preventRequisitionDepot2 = {
    depot : 'Depot Tertiaire',
    reference : 'SREQ.TPA.4',
    className : 'label-warning',
  };

  const preventRequisitionDepot3 = {
    depot : 'Depot Secondaire',
    reference : 'SREQ.TPA.2',
    className : 'label-success',
  };

  // the page object
  const page = new ExitPage();

  // navigate to the page
  test.beforeEach(async () => {
    await TU.navigate('/#!/stock/exit');
  });

  test(`should select the ${DEPOT_PRINCIPAL}`, async () => {
    // Give the page a chance to load
    await TU.waitForSelector('form[name="StockExitForm"]');
    await page.setDepot(DEPOT_PRINCIPAL);
  });

  test(`should distribute the stock to the patient ${PATIENT} linked with the invoice ${INVOICE} `, async () => {
    await page.setDate(new Date());

    // select the patient
    await page.setPatient(PATIENT, INVOICE);

    await page.setDescription(DESCRIPTION.concat(' - Patient'));

    await page.setLot(0, 'QUININE-B');

    // submit
    await page.submit();
  });

  test(`should distribute the stock to the patient ${PATIENT} `, async () => {
    // select the patient
    await page.setPatient(PATIENT, INVOICE);

    // Set the date and description
    await page.setDate(new Date());
    await page.setDescription(DESCRIPTION.concat(' - Patient'));

    // first item
    await page.addRows(1);
    await page.setItem(1, 'DORA_QUIN1S-_0', 'QUININE-C', 20);

    // second item
    await page.addRows(1);
    await page.setItem(2, 'Vitamines', 'VITAMINE-A', 1);

    // submit (checks for receipt, etc)
    await page.submit();
  });

  test(`Should Prevent negative stock quantities when distribute the stock to the patient ${PATIENT} `, async () => {
    const movementDate = moment(new Date(), 'YYYY-MM-DD').subtract(1, 'days');

    // select the patient
    await page.setPatient(PATIENT, INVOICE);
    await page.setDate(new Date(movementDate));
    await page.setDescription(DESCRIPTION.concat(' - Patient'));

    // first item
    await page.addRows(1);
    await page.setItem(1, 'Quinine', 'QUININE-C', 40);

    // second item
    await page.addRows(1);
    await page.setItem(2, 'Vitamines', 'VITAMINE-A', 1);

    // Verify that the page is complaining about errors
    expect(await TU.isPresent(by.hasText('There are errors in the lots grid to be addressed.')));
  });

  test(`should distribute the stock to the service ${SERVICE} `, async () => {
    // select the service
    await page.setService(SERVICE);

    await page.setDate(new Date());

    await page.setDescription(DESCRIPTION.concat(' - Service'));

    // first item
    await page.addRows(1);
    await page.setItem(0, 'Quinine', 'QUININE-B', 8);

    // second item
    await page.addRows(1);
    await page.setItem(1, 'Vitamines', 'VITAMINE-A', 1);

    // submit
    await page.submit();
  });

  test(`should distribute the stock to the depot ${DEPOT_SECONDAIRE} `, async () => {
    // select the depot of destination
    await page.setDestinationDepot(DEPOT_SECONDAIRE);

    await page.setDate(new Date());

    await page.setDescription(DESCRIPTION.concat(' - Depot'));

    // first item
    await page.addRows(1);
    await page.setItem(0, 'Quinine', 'QUININE-C', 10);

    // submit
    await page.submit();
  });

  test('should distribute the stock as a loss ', async () => {
    // select the depot of destination
    await page.setLoss();

    await page.setDate(new Date());

    await page.setDescription(DESCRIPTION.concat(' - Loss'));

    // first item
    await page.addRows(1);
    await page.setItem(0, 'Vitamines', 'VITAMINE-A', 1);

    // submit
    await page.submit();
  });

  test(`should Partial distribute the stock to the depot From Requisition `, async () => {
    await page.setDate(new Date());
    await page.setDescription(DESCRIPTION.concat(' - Depot'));

    // select the depot
    await page.setDepotRequisition(requisitionDepot);

    // Wait for the grid to display
    await TU.waitForSelector('.ui-grid-canvas .ui-grid-row');

    // replace the first item (was out-of-date QUININE-A)
    // Note: Only select 1 even though the req is for 4, to do a partial distribution
    await page.setLot(0, 'QUININE-B', 1);

    // submit
    await page.submit();
  });

  test(`should select the ${DEPOT_SECONDAIRE}`, async () => {
    await page.setDepot(DEPOT_SECONDAIRE);
  });

  // @TODO : This test needs fixing: Not enough vitamins in Secondaire Depot for this (transfer first?)
  test.skip(`should distribute the stock to the service ${requisitionService.service} From Requisition `,
    async () => {

      await page.setDate(new Date());
      await page.setDescription(DESCRIPTION.concat(' - Service'));

      // select the service
      await page.setServiceRequisition(requisitionService);

      // Wait for the grid to display
      await TU.waitForSelector('.ui-grid-canvas .ui-grid-row');

      await page.setLot(0, 'VITAMINE-B');

      // submit
      await page.submit();
    });

  test(`Prevent out of stock for a cancelled requisition`, async () => {
    await page.setDate(new Date());
    await page.setDescription(DESCRIPTION.concat(' - Depot'));

    // select the depot
    await page.preventDepotRequisition(preventRequisitionDepot);
  });

  test(`should select the ${DEPOT_PRINCIPAL} again`, async () => {
    await page.setDepot(DEPOT_PRINCIPAL);
  });

  test(`Prevent out of stock for a requisition from another warehouse `, async () => {
    await page.setDate(new Date());
    await page.setDescription(DESCRIPTION.concat(' - Depot'));

    // select the depot
    await page.preventDepotRequisition(preventRequisitionDepot2);
  });

  // @TODO: These tests need to be refactored/fixed, principal depot has no Prednisolone
  test.skip(`should Complete distribute stock to the depot From Requisition `, async () => {
    await page.setDate(new Date());
    await page.setDescription(DESCRIPTION.concat(' - Depot'));

    // select the depot
    await page.setDepotRequisition(requisitionDepot);

    // Wait for the grid to display
    await TU.waitForSelector('.ui-grid-canvas .ui-grid-row');

    // first item
    await page.setLot(0, 'QUININE-C', 2);

    // submit
    await page.submit();
  });

  // @TODO : Fix with previous test
  test.skip(`Prevent out of stock for a complete requisition from another warehouse `, async () => {
    await page.setDate(new Date());
    await page.setDescription(DESCRIPTION.concat(' - Depot'));

    // select the depot
    await page.preventDepotRequisition(preventRequisitionDepot3);
  });

}

module.exports = StockExitTests;
