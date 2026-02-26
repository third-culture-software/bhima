angular.module('bhima.controllers')
  .controller('StockDefineLotsModalController', StockDefineLotsModalController);

StockDefineLotsModalController.$inject = [
  'appcache', '$uibModalInstance', 'uiGridConstants', 'data', 'LotService',
  'InventoryService', 'SessionService', 'CurrencyService', 'NotifyService',
  'ExchangeRateService', 'ModalService', 'BarcodeService',
  'StockEntryModalForm', 'bhConstants', '$translate', 'focus',
];

/**
 *
 * @param AppCache
 * @param Instance
 * @param uiGridConstants
 * @param Data
 * @param Lots
 * @param Inventory
 * @param Session
 * @param Currencies
 * @param Notify
 * @param ExchangeRate
 * @param Modal
 * @param Barcode
 * @param EntryForm
 * @param bhConstants
 * @param $translate
 * @param Focus
 */
function StockDefineLotsModalController(
  AppCache, Instance, uiGridConstants, Data, Lots, Inventory,
  Session, Currencies, Notify, ExchangeRate, Modal, Barcode,
  EntryForm, bhConstants, $translate, Focus,
) {
  const vm = this;

  const cache = new AppCache('StockEntryModal');

  // initialize the form instance
  if (Data.stockLine.wac) {
    Data.stockLine.unit_cost = Data.stockLine.wac;
  }

  // Hide columns in the grid when it doesn't apply to this inventory item.
  const isAsset = Data.stockLine.is_asset;
  const showShowExpirationDate = !(Data.stockLine.tracking_expiration === 0 || Data.stockLine.is_asset);

  Data.stockLine.prev_unit_cost = Data.stockLine.unit_cost; // Save for later checks

  vm.form = new EntryForm({
    max_quantity : Data.stockLine.quantity,
    unit_cost : Data.stockLine.unit_cost,
    tracking_expiration : Data.stockLine.tracking_expiration,
    entry_date : Data.entry_date,
    rows : Data.stockLine.lots,
  });

  vm.bhConstants = bhConstants;
  vm.hasMissingLotIdentifier = false;
  vm.hasInvalidLotExpiration = false;
  vm.hasInvalidLotQuantity = false;
  vm.hasDuplicateLotInvent = false;
  vm.hasDuplicateLotOrder = false;
  vm.enablePackaging = false;
  vm.lockBoxPurchasePrice = false;
  vm.allowMultiplePackagingPurchase = false;

  vm.globalExpirationDate = new Date();
  vm.globalDefaultAcquisitionDate = new Date();
  vm.enableGlobalDescriptionAndExpiration = false;

  vm.enterprise = Session.enterprise;
  vm.stockSettings = Session.stock_settings;
  vm.stockLine = angular.copy(Data.stockLine);
  vm.entryType = Data.entry_type;
  vm.entryDate = Data.entry_date;
  vm.isAsset = Data.stockLine.is_asset;

  vm.currencyId = Data.currency_id !== undefined
    ? Data.currency_id : vm.enterprise.currency_id;

  // To support the packaging of pharmaceutical products:
  // It will be necessary that
  // - the stock setting parameters can be activated
  // - the depot must be configured as Warehouse but also and allows the packaging of the products
  // - and lastly the inventory must also be configured as having a packaging by box

  if (vm.stockSettings.enable_packaging_pharmaceutical_products && vm.stockLine.is_count_per_container
     && Data.depotPackaged) {
    vm.enablePackaging = true;
  }

  if (vm.enablePackaging && vm.entryType === 'purchase') {
    vm.lockBoxPurchasePrice = true;
    vm.allowMultiplePackagingPurchase = true;
  }

  if (vm.enablePackaging && vm.form.rows.length) {
    let numberPackages = 0;

    vm.stockLine.package_size = vm.form.rows[0].package_size;
    vm.stockLine.box_unit_cost = vm.stockLine.package_size * vm.stockLine.unit_cost;

    vm.form.rows.forEach((row) => {
      numberPackages += row.quantity / row.package_size;
    });

    vm.stockLine.number_packages = numberPackages;
  }

  vm.currency = null;
  vm.isTransfer = (vm.entryType === 'transfer_reception');

  if (vm.isTransfer) {
    vm.enablePackaging = false;
  }

  // Get the status for this inventory article
  Inventory.getInventoryUnitCosts(Data.stockLine.inventory_uuid)
    .then(({ stats }) => {
      // Save the stats for later checks
      vm.stockLine.stats = stats;
    });

  // exposing method to the view
  vm.submit = submit;
  vm.cancel = cancel;

  vm.onLotBlur = onLotBlur;
  vm.addItems = addItems;
  vm.removeItem = removeItem;
  vm.onChanges = onChanges;
  vm.onChangeQuantity = onChangeQuantity;
  vm.onExpDateEditable = onExpDateEditable;
  vm.onChangeUnitCost = onChangeUnitCost;

  vm.onSelectLot = onSelectLot;
  vm.onDateChange = onDateChange;
  vm.onAcquisitionDateChange = onAcquisitionDateChange;
  vm.enterLotByBarcode = enterLotByBarcode;
  vm.onGlobalDateChange = onGlobalDateChange;
  vm.toggleGlobalDescExpColumn = toggleGlobalDescExpColumn;
  vm.onChangePackageManagement = onChangePackageManagement;
  vm.onChangesLotNumberPackage = onChangesLotNumberPackage;

  vm.isCostEditable = (vm.entryType !== 'transfer_reception');

  vm.editExpirationDates = false;

  const cols = [{
    field : 'status',
    width : 25,
    displayName : '',
    cellTemplate : 'modules/stock/entry/modals/templates/lot.status.tmpl.html',
  }, {
    field : 'lot',
    displayName : 'TABLE.COLUMNS.LOT',
    headerCellFilter : 'translate',
    aggregationType : uiGridConstants.aggregationTypes.count,
    aggregationHideLabel : true,
    cellTemplate : 'modules/stock/entry/modals/templates/lot.input.tmpl.html',
  }, {
    field : 'reference_number',
    displayName : 'FORM.LABELS.REFERENCE_NUMBER',
    headerCellFilter : 'translate',
    visible : false,
    width : 150,
    cellTemplate : '/modules/stock/lots/templates/reference_number.cell.html',
  }, {
    field : 'serial_number',
    displayName : 'TABLE.COLUMNS.SERIAL_NUMBER',
    headerCellFilter : 'translate',
    aggregationHideLabel : true,
    visible : isAsset,
    width : 220,
    cellTemplate : 'modules/stock/entry/modals/templates/serial_number.input.tmpl.html',
  }, {
    field : 'barcode',
    displayName : 'BARCODE.BARCODE',
    headerCellFilter : 'translate',
    width : 110,
    cellTemplate : 'modules/stock/entry/modals/templates/lot.barcode.tmpl.html',
  }, {
    field : 'number_package',
    type : 'number',
    width : 120,
    displayName : 'FORM.LABELS.NUMBER_PACKAGES',
    headerCellFilter : 'translate',
    aggregationType : uiGridConstants.aggregationTypes.sum,
    aggregationHideLabel : true,
    footerCellClass : 'text-right',
    cellTemplate : 'modules/stock/entry/modals/templates/lot.number_package.tmpl.html',
    visible : vm.enablePackaging,
  }, {
    field : 'quantity',
    type : 'number',
    width : 120,
    displayName : 'TABLE.COLUMNS.QUANTITY',
    headerCellFilter : 'translate',
    aggregationType : uiGridConstants.aggregationTypes.sum,
    aggregationHideLabel : true,
    footerCellClass : 'text-right',
    cellTemplate : 'modules/stock/entry/modals/templates/lot.quantity.tmpl.html',
    visible : !isAsset,
  }, {
    field : 'expiration_date',
    type : 'date',
    cellFilter : `date:"${bhConstants.dates.format}"`,
    width : 150,
    visible : showShowExpirationDate,
    displayName : 'TABLE.COLUMNS.EXPIRATION_DATE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/stock/entry/modals/templates/lot.expiration.tmpl.html',
  }, {
    field : 'acquisition_date',
    type : 'date',
    cellFilter : `date:"${bhConstants.dates.format}"`,
    width : 150,
    visible : isAsset,
    displayName : 'TABLE.COLUMNS.ACQUISITION_DATE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/stock/entry/modals/templates/lot.acquisition_date.tmpl.html',
  }, {
    field : 'actions',
    displayName : '',
    width : 25,
    cellTemplate : 'modules/stock/entry/modals/templates/lot.actions.tmpl.html',
  }];

  vm.gridOptions = {
    appScopeProvider : vm,
    enableSorting : false,
    enableColumnResize : true,
    enableColumnMenus : false,
    showColumnFooter : true,
    fastWatch : true,
    flatEntityAccess : true,
    data : vm.form.rows,
    minRowsToShow : 4,
    columnDefs : cols,
    onRegisterApi,
  };

  /**
   *
   */
  function init() {
    if (cache.enableFastInsert) {
      vm.enableFastInsert = cache.enableFastInsert;
    }

    // Load the currency info
    Currencies.read()
      .then((currencies) => {
        vm.currency = currencies.find(curr => curr.id === vm.currencyId);
        vm.currency.label = Currencies.format(vm.currencyId);
        const rate = ExchangeRate.getExchangeRate(vm.currencyId, new Date());
        vm.wacValue = rate * Data.stockLine.wacValue;
      })
      .catch(Notify.handleError);

    if (vm.form.rows.length) {
      // If we are visiting the form again, re-validate it
      validateForm();
      return;
    }

    vm.form.addItem();
  }

  /**
   *
   * @param api
   */
  function onRegisterApi(api) {
    vm.gridApi = api;
  }

  /**
   *
   * @param value
   */
  function toggleGlobalDescExpColumn(value) {
    const EXPIRATION_DATE_COLUMN = 4;
    cols[EXPIRATION_DATE_COLUMN].visible = !!value;
    vm.gridApi.grid.refresh();
  }

  /**
   *
   * @param label
   */
  function lookupLotByLabel(label) {
    return vm.stockLine.availableLots
      .find(l => l.label.toUpperCase() === label.toUpperCase());
  }

  /**
   *
   * @param uuid
   */
  function lookupLotByUuid(uuid) {
    return vm.stockLine.availableLots
      .find(l => l.uuid === uuid);
  }

  /**
   *
   */
  function onChangePackageManagement() {
    vm.stockLine.quantity = vm.stockLine.number_packages * vm.stockLine.package_size;

    vm.form.rows.forEach((row) => {
      row.quantity = row.number_package * vm.stockLine.package_size;
      row.package_size = vm.stockLine.package_size;
    });

    if (!vm.lockBoxPurchasePrice) {
      vm.stockLine.unit_cost = vm.stockLine.box_unit_cost / vm.stockLine.package_size;

      vm.form.setMaxQuantity(vm.stockLine.quantity);
    } else {
      vm.stockLine.box_unit_cost = vm.stockLine.unit_cost * vm.stockLine.package_size;
    }

    onChanges();
  }

  /**
   * @function getExistingLot
   * @description
   *  If the lot given is a string, it is a label, so look it up by label.
   *  If the lot is not a string, it will contain the lots UUID, use it to look up the lot
   * @param {lot} the 'lot' object from the lot selection popup modal form
   * @param lot
   */
  function getExistingLot(lot) {
    return typeof lot === 'string' ? lookupLotByLabel(lot) : lookupLotByUuid(lot.uuid);
  }

  // Handle the extra validation for expired lot labels
  /**
   *
   */
  function validateForm() {
    vm.errors = vm.form.validate(vm.entryDate);

    vm.form.rows.forEach((row) => {
      if (!row.lot) {
        // Ignore corner case where the user clicks elsewhere
        // BEFORE typing in a lot name
        return;
      }

      const existingLot = getExistingLot(row.lot);

      row.editExpDateDisabled = (existingLot && !vm.editExpirationDates);

      // Check to make sure the lot has not expired
      if (existingLot && existingLot.expired) {

        vm.errors.push($translate.instant('ERRORS.ER_STOCK_LOT_IS_EXPIRED',
          { label : existingLot.label }));

        vm.form.$invalid = true;
      }

    });
  }

  /**
   * @function onLotBlur
   * @description
   * if the fast insert option is enable do this :
   * - add new row automatically on blur
   * - set the focus in the new row
   * @param {string} rowLot the row.entity.lot string/object
   */
  function onLotBlur(rowLot) {
    // NOTE: rowLot will be an object if an existing lot was
    //       selected from the typeahead. Otherwise
    //       it will be the lot name string that was typed in.
    //       Complain if the lot exists and is expired.

    if (!rowLot) {
      // Handle corner case
      return;
    }

    vm.errors = vm.form.validate(vm.entryDate);

    // First make sure that if the entered lot label exists
    // that it is not expired

    const rowLotLabel = typeof rowLot === 'string' ? rowLot : rowLot.label;
    const existingLot = vm.stockLine.availableLots
      .find(l => l.label.toUpperCase() === rowLotLabel.toUpperCase());

    if (rowLot && existingLot && existingLot.expired) {
      vm.errors.push($translate.instant('ERRORS.ER_STOCK_LOT_IS_EXPIRED',
        { label : existingLot.label }));
      vm.form.$invalid = true;
      return;
    }

    if (vm.enableFastInsert && rowLot) {

      const emptyLotRow = getFirstEmptyLot();

      if (emptyLotRow) {

        if (vm.enableGlobalDescriptionAndExpiration && vm.globalExpirationDate) {
          emptyLotRow.expiration_date = vm.globalExpirationDate;
        }

        if (isAsset) {
          emptyLotRow.acquisition_date = vm.globalDefaultAcquisitionDate;
        }

        // don't add new row but focus on the empty lot row
        Focus(emptyLotRow.identifier);
      } else {
        // add a new row
        const newLotRow = vm.form.addItem();

        if (vm.enableGlobalDescriptionAndExpiration && vm.globalExpirationDate) {
          newLotRow.expiration_date = vm.globalExpirationDate;
        }

        if (isAsset) {
          newLotRow.acquisition_date = vm.globalDefaultAcquisitionDate;
        }

        // set the focus on the new row
        Focus(newLotRow.identifier);
      }
    }
  }

  /**
   *
   * @param rowRenderIndex
   */
  function removeItem(rowRenderIndex) {
    vm.form.removeItem(rowRenderIndex);
    vm.errors = vm.form.validate(vm.entryDate);
  }

  /**
   *
   * @param n
   */
  function addItems(n) {
    const defaultValues = vm.enableGlobalDescriptionAndExpiration && vm.globalExpirationDate
      ? { expiration_date : vm.globalExpirationDate }
      : {};

    if (isAsset) {
      defaultValues.acquisition_date = vm.globalDefaultAcquisitionDate;
    }

    vm.form.addItems(n, defaultValues);
  }

  /**
   *
   */
  function getFirstEmptyLot() {
    let line;

    for (let i = 0; i < vm.form.rows.length; i++) {
      const row = vm.form.rows[i];
      if (!row.lot || row.lot.length === 0) {
        line = row;
        break;
      }
    }

    return line;
  }

  /**
   *
   */
  function onChanges() {
    validateForm();

    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.EDIT);
  }

  // validate only if there are lots rows
  /**
   *
   */
  function onChangeQuantity() {
    vm.form.setMaxQuantity(vm.stockLine.quantity);
    if (!vm.form.rows.length) { return; }
    onChanges();
  }

  /**
   *
   */
  function onExpDateEditable() {
    vm.form.rows.forEach((row) => {
      if (row.lot === null) {
        return;
      }
      row.editExpDateDisabled = (getExistingLot(row.lot) && !vm.editExpirationDates);
    });
  }

  /**
   *
   */
  function onChangeUnitCost() {
    // Sanity check on new unit cost
    const prevPurchases = vm.stockLine.stats.median_unit_cost !== null;
    // NOTE: If there are no previous purchases, there is no purchase history to rely on
    // for sanity checks so use the unit cost was from the purchase order for the sanity check
    const prevUnitCost = Number(vm.stockLine.prev_unit_cost);
    const medianUnitCost = prevPurchases ? Number(vm.stockLine.stats.median_unit_cost) : prevUnitCost;
    const newUnitCost = Number(vm.stockLine.unit_cost);
    const allowableMinChange = 0.5; // Warn about entries that are less than half the previous unit cost
    const allowableMaxChange = 2.0; // Warn entries that more than double the previous unit cost
    const lowerUnitCostBound = (medianUnitCost * allowableMinChange);
    const upperUnitCostBound = (medianUnitCost * allowableMaxChange);
    if ((newUnitCost < lowerUnitCostBound) || (newUnitCost > upperUnitCostBound)) {
      const msgParams = { newUnitCost, medianUnitCost, curr : vm.currency.symbol };
      const errMsg1 = newUnitCost > upperUnitCostBound
        ? $translate.instant('WARNINGS.WARN_UNIT_COST_TOO_HIGH', msgParams)
        : $translate.instant('WARNINGS.WARN_UNIT_COST_TOO_LOW', msgParams);
      const errMsg = errMsg1
        .concat($translate.instant('WARNINGS.WARN_UNIT_COST_REASON'))
        .concat($translate.instant('WARNINGS.WARN_UNIT_COST_CONFIRM'));
      Modal.confirm(errMsg)
        .then(() => {
          // Accept the new unit cost into the form
          vm.form.setUnitCost(vm.stockLine.unit_cost);
          onChanges();
        })
        .catch(() => {
          // Revert to the previous unit cost in the form and display the warning
          vm.stockLine.unit_cost = prevUnitCost;
          vm.form.setUnitCost(vm.stockLine.unit_cost);
          vm.errors = [errMsg1];
          vm.form.$invalid = true;
        });
      return;
    }
    vm.form.setUnitCost(vm.stockLine.unit_cost);
    onChanges();
  }

  /**
   *
   * @param date
   * @param row
   */
  function onDateChange(date, row) {
    if (date) {
      row.expiration_date = date;
      onChanges();
    }
  }

  /**
   *
   * @param date
   * @param row
   */
  function onAcquisitionDateChange(date, row) {
    if (date) {
      row.acquisition_date = date;
      onChanges();
    }
  }

  /**
   *
   * @param row
   */
  function onChangesLotNumberPackage(row) {
    row.quantity = row.number_package * vm.stockLine.package_size;
    row.package_size = vm.stockLine.package_size;

    vm.form.setMaxQuantity(vm.stockLine.quantity);
    if (!vm.form.rows.length) { return; }
    onChanges();
  }

  /**
   *
   * @param row
   * @param label
   */
  function lotMatch(row, label) {
    if (row.lot === null) {
      return false;
    }
    if (typeof row.lot === 'string') {
      return row.lot.toUpperCase() === label;
    }
    if (typeof row.lot.label === 'string') {
      return row.lot.label.toUpperCase() === label;
    }
    return false;
  }

  /**
   *
   * @param label
   */
  function lookupLotInForm(label) {
    return vm.form.rows.find(row => lotMatch(row, label));
  }

  /**
   * @function enterLotByBarcode
   * @description
   * Pops up modal to scan the lot barcode
   * @param {object} row the affected row
   */
  function enterLotByBarcode(row) {
    Barcode.modal({ shouldSearch : false })
      .then(record => {
        if (record.uuid) {
          const newLotLabel = record.uuid.toUpperCase();

          if (vm.enableGlobalDescriptionAndExpiration) {
            // In this mode, the new lot IDs must not already be known or in already entered
            // TODO: Make this a separate user check box option?
            if (lookupLotByLabel(record.uuid)) {
              vm.errors.push($translate.instant('STOCK.DUPLICATE_LOT_INVENTORY'));
              vm.form.$invalid = true;
              return;
            }
            if (lookupLotInForm(newLotLabel)) {
              vm.errors.push($translate.instant('STOCK.DUPLICATE_LOT_ORDER'));
              vm.form.$invalid = true;
              return;
            }
          }

          // Save the new lot!
          row.lot = newLotLabel;
          if (vm.enableGlobalDescriptionAndExpiration && vm.globalExpirationDate) {
            row.expiration_date = vm.globalExpirationDate;
          }

          if (isAsset) {
            row.acquisition_date = vm.globalDefaultAcquisitionDate;
          }

          onChanges();
          if (vm.enableFastInsert) {
            vm.form.addItem();
          }
        }
      });
  }

  /**
   *
   * @param date
   */
  function onGlobalDateChange(date) {
    if (date) {
      vm.globalExpirationDate = date;
      vm.globalDefaultAcquisitionDate = date;

      vm.form.rows.forEach((row) => {
        row.expiration_date = vm.globalExpirationDate;
        row.acquisition_date = vm.globalDefaultAcquisitionDate;
      });

      onChanges();
    }
  }

  /**
   * @function onSelectLot
   * @description
   * Updates the expiration field based on the date in
   * the corresponding candidate lot.
   *
   * NOTE: This function is only called when a lot is selected
   *       from the typeahead (which is created from the list
   *       valid candidate lots for this inventory item).  So
   *       the 'find()' below should always work.
   * @param {object} entity the row.entity.lot object (being displayed)
   * @param {object} item the active typeahead model object
   */
  function onSelectLot(entity, item) {
    const lot = vm.stockLine.candidateLots.find(l => l.uuid === item.uuid);
    entity.expiration_date = new Date(lot.expiration_date);
    entity.editExpDateDisabled = !vm.editExpirationDates;
    onChanges();
  }

  /**
   *
   */
  function cancel() {
    saveSetting();
    Instance.close();
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    validateForm();

    // unfortunately, a negative number will not trigger the onChange() function
    // on the quantity, since the "min" property is set on the input.  So, we
    // need to through a generic error here.
    if (form.$invalid) {
      return null;
    }

    // Handle differences in selecting vs creating lots
    vm.form.rows.forEach((row) => {
      if (typeof row.lot !== 'string') {
        const { label, uuid } = row.lot;
        row.lot = label;
        row.uuid = uuid;
      }

      if (vm.enableGlobalDescriptionAndExpiration && vm.description) {
        row.description = vm.description;
      }
    });

    // Maybe update some lot expiration dates
    const promises = [];
    if (vm.editExpirationDates) {
      vm.form.rows.forEach((row) => {
        const existingLot = getExistingLot(row.lot);
        if (existingLot && (row.expiration_date !== existingLot.expiration_date)) {
          promises.push(Lots.update(existingLot.uuid, { expiration_date : row.expiration_date }));
        }
      });
    }

    return Promise.all(promises)
      .then(() => {
        saveSetting();
        Instance.close({
          lots : vm.form.rows,
          unit_cost : vm.stockLine.unit_cost,
          quantity : vm.form.total(),
          openMultiplePackaging : vm.entryStockMultiplePackaging,
        });
      })
      .catch(Notify.handleError);
  }

  /**
   *
   */
  function saveSetting() {
    // save the cache setting
    cache.enableFastInsert = vm.enableFastInsert;
  }

  init();
}
