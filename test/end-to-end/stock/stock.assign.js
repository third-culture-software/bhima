const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

// const SearchModal = require('../shared/search.page');
const Page = require('./stock.assign.page');

// const { notification } = require('../shared/components');

/**
 *
 */
function StockAssignTests() {
  const path = '/#!/stock/assign';
  // let modal;
  let page;

  test.beforeEach(async () => {
    await TU.navigate(path);
    page = new Page();
    // modal = new SearchModal('stock-assign-search', path);
  });

  const record = {
    depot : 'Depot Principal',
    inventory : 'Vitamines B1+B6+B12, 100+50+0.5mg/2ml, Amp, Unité',
    lot : 'VITAMINE-A',
    entity : 'Bruce Wayne',
    description : 'Assign VITAMINE-A to Bruce Wayne',
    quantity : 1,
  };

  // const record2 = {
  //   depot : 'Depot Secondaire',
  //   inventory : 'Quinine',
  //   lot : 'VITAMINE-B',
  //   entity : 'Wayne Enterprise',
  // };

  test('Create a new stock assignment', async () => {
    await page.showCreateModal();
    await page.setDepot(record.depot);
    await page.setInventory(record.inventory);
    await page.setLot(record.lot);
    await page.setEntity(record.entity);
    await page.setQuantity(record.quantity);
    await page.setDescription(record.description);
    await page.submit();
  });

  // test('Search assignment by depot', async () => {
  //   await SearchModal.open();
  //   await modal.setDepot(record.depot);
  //   await modal.submit();
  //   await page.expectRowCount(1);
  //   await page.expectCellValueMatch(0, 0, record.depot);
  // });

  // test('Search assignment by a bad depot', async () => {
  //   await SearchModal.open();
  //   await modal.setDepot(record2.depot);
  //   await modal.submit();
  //   await page.expectRowCount(0);
  // });

  // test('Search assignment by inventory', async () => {
  //   await SearchModal.open();
  //   await modal.setDepot(record.depot);
  //   await modal.setInventory(record.inventory);
  //   await modal.submit();
  //   await page.expectRowCount(1);
  //   await page.expectCellValueMatch(0, 2, record.inventory);
  // });

  // test('Search assignment by a bad inventory', async () => {
  //   await SearchModal.open();
  //   await modal.setDepot(record.depot);
  //   await modal.setInventory(record2.inventory);
  //   await modal.submit();
  //   await page.expectRowCount(0);
  // });

  // test('Search assignment by lot', async () => {
  //   await SearchModal.open();
  //   await modal.setDepot(record.depot);
  //   await modal.setInventory(record.inventory);
  //   await modal.setLotLabel(record.lot);
  //   await modal.submit();
  //   await page.expectRowCount(1);
  //   await page.expectCellValueMatch(0, 3, record.lot);
  // });

  // test('Search assignment by a bad lot', async () => {
  //   await SearchModal.open();
  //   await modal.setDepot(record.depot);
  //   await modal.setInventory(record.inventory);
  //   await modal.setLotLabel(record2.lot);
  //   await modal.submit();
  //   await page.expectRowCount(0);
  // });

  // test('Search assignment by entity', async () => {
  //   await SearchModal.open();
  //   await modal.setDepot(record.depot);
  //   await modal.setInventory(record.inventory);
  //   await modal.setLotLabel(record.lot);
  //   await modal.setEntity(record.entity);
  //   await modal.submit();
  //   await page.expectRowCount(1);
  //   await page.expectCellValueMatch(0, 4, record.entity);
  // });

  // test('Search assignment by a bad entity', async () => {
  //   await SearchModal.open();
  //   await modal.setDepot(record.depot);
  //   await modal.setInventory(record.inventory);
  //   await modal.setLotLabel(record.lot);
  //   await modal.setEntity(record2.entity);
  //   await modal.submit();
  //   await page.expectRowCount(0);
  // });

  // test('Remove stock assignment', async () => {
  //   await SearchModal.open();
  //   await modal.setDepot(record.depot);
  //   await modal.setInventory(record.inventory);
  //   await modal.setLotLabel(record.lot);
  //   await modal.setEntity(record.entity);
  //   await modal.submit();
  //   await page.deleteAssignment();
  //   await notification.hasSuccess();
  //   await page.expectRowCount(0);
  // });

}

module.exports = StockAssignTests;
