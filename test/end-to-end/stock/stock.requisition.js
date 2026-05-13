const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const SearchModal = require('../shared/search.page');
const Page = require('./stock.requisition.page');

/**
 *
 */
function StockRequisitionTests() {
  const path = '/#!/stock/requisition';
  let modal;
  let page;

  // actions before each tests
  test.beforeEach(async () => {
    await TU.navigate(path);
    page = new Page();
    modal = new SearchModal('stock-requisition-search', path);
  });

  const DEPOT_PRINCIPAL = 'Depot Principal';
  const DEPOT_SECONDAIRE = 'Depot Secondaire';
  const DEPOT_TERTIAIRE = 'Depot Tertiaire';

  const SERVICE = 'Test Service';
  const REFERENCES = ['SREQ.TPA.5', 'SREQ.TPA.6', 'SREQ.TPA.7', 'SREQ.TPA.8'];
  const NOT_REFERENCE = 'SREQ.ZERO';

  test(`Should select the ${DEPOT_PRINCIPAL}`, async () => {
    // await TU.waitForSelector('[data-depot-selection-modal]');
    await page.changeDepot(DEPOT_PRINCIPAL);
  });

  // @TODO : FIXME(@jniles) - impossible to automatically allocate stock given the CMM calculation changes
  // we need to have relative dates before this will work.
  test.skip(`Create a new stock requisition based on current depot ${DEPOT_PRINCIPAL}`, async () => {
    await page.showCreateModal(true);
    await page.setDepot(DEPOT_SECONDAIRE);
    await page.setDescription(`Quick Requisition from current depot ${DEPOT_PRINCIPAL}`);
    await page.submit();
  });

  test(`Create a new stock requisition from scratch for a service`, async () => {
    await page.showCreateModal();
    await page.setRequestor(SERVICE, 'service');
    await page.setDepot(DEPOT_PRINCIPAL);
    await page.setDescription(`Requisition for ${SERVICE}`);

    await page.setRows(1);
    await page.addItem(0, 'DORA_QUIN1S-_0', 20); // Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité

    await page.setRows(1);
    await page.addItem(1, 'DINJ_TRIB1A2_0', 20); // Vitamines B1+B6+B12, 100+50+0.5mg/2ml, Amp, Unité

    await page.submit();
  });

  test(`Create a new stock requisition from scratch for a depot`, async () => {
    await page.showCreateModal();

    await page.setRequestor(DEPOT_SECONDAIRE, 'depot');
    await page.setDepot(DEPOT_PRINCIPAL);
    await page.setDescription(`Requisition for ${DEPOT_SECONDAIRE}`);

    await page.setRows(1);
    await page.addItem(0, 'Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité', 4);

    await page.setRows(1);
    await page.addItem(1, 'Prednisolone, 0,5%, Solution, Flacon, Unité', 500);

    await page.submit();
  });

  test(`Create a Cancelled requisition`, async () => {
    await page.showCreateModal();
    await page.setRequestor(DEPOT_TERTIAIRE, 'depot');
    await page.setDepot(DEPOT_SECONDAIRE);
    await page.setDescription(`Requisition for ${DEPOT_SECONDAIRE}`);

    await page.setRows(1);
    await page.addItem(0, 'Bottes, couleur noire, caoutchouc, taille 44, Paire', 20);

    await page.setRows(1);
    await page.addItem(1, 'Atazanavir + Ritonavir 30 mg + 100 mg, 30 comp, unité', 25);

    await page.setRows(1);
    await page.addItem(2, 'Chlorhexidine sol concentrée à 5% 100 ml,flacon,unité', 35);

    await page.submit();
  });

  test(`Create a requisition for other depot`, async () => {
    await page.showCreateModal();

    await page.setRequestor(DEPOT_TERTIAIRE, 'depot');
    await page.setDepot(DEPOT_PRINCIPAL);
    await page.setDescription(`Requisition for ${DEPOT_SECONDAIRE}`);

    await page.setRows(1);
    await page.addItem(0, 'Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité', 4);

    await page.setRows(1);
    await page.addItem(1, 'Vitamines B1+B6+B12, 100+50+0.5mg/2ml, Amp, Unité', 20);

    await page.submit();
  });

  test('Search requisition by depot requestor', async () => {
    await modal.open();
    await modal.reset();
    await modal.setRequestor(DEPOT_SECONDAIRE, 'depot');
    await modal.submit();
    await page.expectRowCount(2);

    await modal.open();
    await modal.reset();
    await modal.setRequestor(DEPOT_PRINCIPAL, 'depot');
    await modal.submit();
    await page.expectRowCount(0);
  });

  test('Search requisition by service requestor', async () => {
    await modal.open();
    await modal.reset();
    await modal.setRequestor(SERVICE, 'service');
    await modal.submit();
    await page.expectRowCount(2);
  });

  test('Search requisition by depot supplier', async () => {
    await modal.open();
    await modal.reset();
    await modal.setDepot(DEPOT_SECONDAIRE);
    await modal.submit();
    await page.expectRowCount(4);

    await modal.open();
    await modal.reset();
    await modal.setDepot(DEPOT_PRINCIPAL);
    await modal.submit();
    await page.expectRowCount(4);
  });

  test('Search requisition by reference', async () => {
    await modal.open();
    await modal.reset();
    await modal.setReference(REFERENCES[0]);
    await modal.submit();
    await page.expectRowCount(1);

    await modal.open();
    await modal.reset();
    await modal.setReference(REFERENCES[1]);
    await modal.submit();
    await page.expectRowCount(1);

    await modal.open();
    await modal.reset();
    await modal.setReference(REFERENCES[2]);
    await modal.submit();
    await page.expectRowCount(1);

    await modal.open();
    await modal.reset();
    await modal.setReference(NOT_REFERENCE);
    await modal.submit();
    await page.expectRowCount(0);
  });

  test('Update stock requisition', async () => {
    await modal.open();
    await modal.reset();
    await modal.setReference(REFERENCES[1]);
    await modal.submit();
    await page.updateRequisition(0);

    await modal.setRequestor(DEPOT_SECONDAIRE, 'depot');

    await page.setDepot(DEPOT_PRINCIPAL);
    await page.setDescription(`Update the Requisition: ${REFERENCES[1]}`);

    await page.setRows(1);
    await page.addItem(2, 'Polyvidone iodée, 10%, 200ml, flacon, Unité', 4);

    await page.setRows(1);
    await page.addItem(3, 'Boîtiers pour lames 5 places', 12);

    await page.submit();
  });

  test('Remove stock requisition', async () => {
    await modal.open();
    await modal.reset();
    await modal.setReference(REFERENCES[0]);
    await modal.submit();
    await page.removeRequisition(0);
    await page.expectRowCount(0);
  });

  test('Change the status of a requisition', async () => {
    await modal.open();
    await modal.reset();
    await modal.setReference(REFERENCES[3]);
    await modal.submit();
    await page.changeStatus(0, 'cancelled');
  });

}

module.exports = StockRequisitionTests;
