 

const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');
const { by } = require('../shared/TestUtils');

const GU = require('../shared/GridUtils');

const components = require('../shared/components');

const ComplexVoucherPage = require('./complex.page');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Complex Vouchers', () => {

  test.beforeEach(async () => {
    await TU.navigate('/#!/vouchers/complex');
  });

  test('creates a complex voucher', async () => {

    // async function create() {
    const page = await ComplexVoucherPage.new();

    /*
     * the voucher we will use in this page
     * NOTE: the Caisse Principale USD is a financial account which involve that we
     * specify the transfer type
     */
    const voucher = {
      date : new Date(),
      description : 'Complex voucher test e2e',
      rows : [
        {
          account : 'CASH PAYMENT CLIENT', debit : 18, credit : 0, entity : 'PA.TPA.2',
        },
        {
          account : 'Caisse Principale USD', debit : 0, credit : 8, reference : 'VO.TPA.1',
        },
        {
          account : 'CASH PAYMENT CLIENT', debit : 0, credit : 5, reference : 'VO.TPA.2',
        },
        {
          account : 'CASH PAYMENT CLIENT', debit : 0, credit : 5, reference : 'VO.TPB.1',
        },
        {
          account : 'Caisse Principale USD', debit : 7, credit : 0, entity : 'PA.TPA.4',
        },
        {
          account : 'CASH PAYMENT CLIENT', debit : 0, credit : 7, reference : 'IV.TPA.4',
        },
      ],
    };

    // configure the date to today
    await page.date(voucher.date);

    // set the description
    await page.description(voucher.description);

    // set the currency to USD
    await page.currency(2);

    // add four rows
    await page.addRow();
    await page.addRow();
    await page.addRow();
    await page.addRow();

    // loop through each row and assign the correct form values
    let idx = 0;

     
    for (const row of voucher.rows) {
      const current = page.row(idx);
      await current.account(row.account);
      await current.debit(row.debit);
      await current.credit(row.credit);

      if (row.entity) {
        await current.entity(row.entity);
      }

      if (row.reference) {
        await current.reference(row.reference);
      }

      idx += 1;
    }

    // set the transaction type to one which have a specific Id
    // (e.g. cash payment Id is 1)
    // @see client/src/js/services/VoucherService.js
    await page.transactionType('Other Income');

    // submit the page
    await TU.buttons.submit();

    // make sure a receipt was opened
    await TU.waitForSelector(`.modal-header ${by.id('receipt-confirm-created')}`);

    // close the modal
    await TU.modal.close();
  });

  test.skip('Convention import invoices and payment via the tool', async () => {
    // @TODO: This test needs to be fixed.  Once the modal for the Convention
    //        is processed, there are no people that will appear under the
    //        conventions available (Cash Paying Clients, NG IMA World Health).
    //        Neither have any available people to assign.  There are two ways
    //        to fix this: (1) temporarily assign 'Church Employees' to a
    //        convention, or (2) create a user in the two available groups.

    const detail = {
      tool            : 'Convention - Invoices payment',
      cashbox         : 'Caisse Auxiliaire $',
      convention      : 'NGO IMA World Health',
      invoices        : [0, 1],
      description     : 'Convention payment with journal voucher',
    };

    const page = await ComplexVoucherPage.new();

    // click on the convention tool
    await TU.dropdown('[toolbar-dropdown]', detail.tool);
    await TU.waitForSelector('[uib-modal-window]');

    await components.cashboxSelect.set(detail.cashbox);

    await components.debtorGroupSelect.set(detail.convention);

    // select invoices
    await GU.selectRow('invoiceGrid', detail.invoices[0]);

    // validate selection
    await TU.modal.submit();

    // description
    await page.description(detail.description);

    // submit voucher
    await TU.buttons.submit();

    // make sure a receipt was opened
    await TU.waitForSelector(`.modal-header ${by.id('receipt-confirm-created')}`);

    // close the modal
    await TU.modal.close();
  });

  test('Support Patient Invoices by an Account via the tool', async () => {
    const page = new ComplexVoucherPage();

    const detail = {
      tool          : 'Patients Support - Form',
      accountNumber : '42210010', // 42210010 - Salaires à payer
      patientName   : 'Test 2 Patient',
      description   : 'Patient Support invoices',
      invoices      : [0, 1],
    };

    // click on the Support Patient Tool
    await TU.dropdown('[toolbar-dropdown]', detail.tool);
    await TU.waitForSelector('[uib-modal-window]');

    // select account
    await components.accountSelect.set(detail.accountNumber);

    // Find Patient
    await components.findPatient.findByName(detail.patientName);

    // select invoices
    await GU.selectRow('invoiceGrid', detail.invoices[0]);

    // validate selection
    await TU.modal.submit();

    // description
    await page.description(detail.description);

    // submit voucher
    await TU.buttons.submit();

    // make sure a receipt was opened
    await TU.waitForSelector(`.modal-header ${by.id('receipt-confirm-created')}`);

    // close the modal
    await TU.modal.close();
  });

  test('Generic Income via the tool', async () => {
    const detail = {
      tool        : 'Generic Income',
      cashbox     : 'Caisse Auxiliaire',
      account     : '41111010', // CHURCH
      description : 'E2E RECETTE GENERIQUE',
      amount      : 3000,
    };

    const page = new ComplexVoucherPage();

    // click on the convention tool
    await TU.dropdown('[toolbar-dropdown]', detail.tool);
    await TU.waitForSelector('[uib-modal-window]');

    // select the cashbox
    await page.selectCashbox(detail.cashbox, '$');

    // select the account
    await components.accountSelect.set(detail.account);

    // description
    await TU.input('ToolCtrl.description', detail.description);

    // amount
    await components.currencyInput.set(detail.amount);

    // validate selection
    await TU.modal.submit();

    // submit voucher
    await TU.buttons.submit();

    // make sure a receipt was opened
    await TU.waitForSelector(`.modal-header ${by.id('receipt-confirm-created')}`);

    // close the modal
    await TU.modal.close();
  });

  test('Generic Expense via the tool', async () => {
    const detail = {
      tool        : 'Generic Expense',
      cashbox     : 'Caisse Auxiliaire',
      account     : '60521010', // 60521010 - Electricité
      description : 'Payment for electricity',
      amount      : 1000,
    };

    const page = new ComplexVoucherPage();

    // click on the convention tool
    await TU.dropdown('[toolbar-dropdown]', detail.tool);
    await TU.waitForSelector('[uib-modal-window]');

    // select the cashbox (the first ie Fc)
    await page.selectCashbox(detail.cashbox, 'Fc');

    // select the account
    await components.accountSelect.set(detail.account);

    // description
    await TU.input('ToolCtrl.description', detail.description);

    // amount
    await components.currencyInput.set(detail.amount);

    // validate selection
    await TU.modal.submit();

    // submit voucher
    await TU.buttons.submit();

    // make sure a receipt was opened
    await TU.waitForSelector(`.modal-header ${by.id('receipt-confirm-created')}`);

    // close the modal
    await TU.modal.close();
  });

  test.skip('Employees Salary Paiement via the tool', async () => {
    // @TODO: Using these settings, there are no employees with salaries configured so
    //        selecting the first row of the list  of employee salaries does not work
    const page = new ComplexVoucherPage();
    const gridId = 'paymentGrid';

    const detail = {
      cashbox       : 'Caisse Auxiliaire $',
      tool          : 'Payment of wages',
      period        : 'Février 2018',
      description   : 'Paiement Salaire Février 2018',
    };

    // click on the Support Patient Tool
    await TU.dropdown('[toolbar-dropdown]', detail.tool);
    await TU.waitForSelector('[uib-modal-window]');

    // Select Cashbox
    await components.cashboxSelect.set(detail.cashbox);

    // Select Payroll Period
    await components.payrollPeriodSelect.set(detail.period);

    await GU.selectRow(gridId, 1);

    // validate selection
    await TU.modal.submit();

    // description
    await page.description(detail.description);

    // submit voucher
    await TU.buttons.submit();

    // make sure a receipt was opened
    await TU.waitForSelector(`.modal-header ${by.id('receipt-confirm-created')}`);

    // close the modal
    await TU.modal.close();
  });

});
