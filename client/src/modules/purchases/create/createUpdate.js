angular.module('bhima.controllers')
  .controller('PurchaseOrderController', PurchaseOrderController);

PurchaseOrderController.$inject = [
  'PurchaseOrderService', 'PurchaseOrderForm', 'NotifyService', 'ModalService',
  'SessionService', 'util', 'ReceiptModal', 'bhConstants', 'StockService',
  'CurrencyService', 'ExchangeRateService', '$state', '$translate', '$q',
  'StockModalService',
];

/**
 * @param Purchases
 * @param PurchaseOrder
 * @param Notify
 * @param Modal
 * @param Session
 * @param util
 * @param Receipts
 * @param bhConstants
 * @param Stock
 * @param Currencies
 * @param Exchange
 * @param $state
 * @param $translate
 * @param $q
 * @param StockModal
 * @function PurchaseOrderController
 * @description
 * The controller binds the functionality of the PurchaseOrderForm to the purchase
 * order create/update modules.
 */
function PurchaseOrderController(
  Purchases, PurchaseOrder, Notify, Modal,
  Session, util, Receipts, bhConstants, Stock,
  Currencies, Exchange, $state, $translate, $q,
  StockModal,
) {
  const vm = this;

  vm.bhConstants = bhConstants;

  // create a new purchase order form
  vm.order = new PurchaseOrder('PurchaseOrder');

  vm.isUpdateState = ($state.params.uuid && $state.params.uuid.length > 0);

  vm.enterprise = Session.enterprise;
  vm.stockSettings = Session.stock_settings;

  vm.maxLength = util.maxLength;
  vm.maxDate = new Date();
  vm.loadingState = false;
  vm.optimalPurchase = optimalPurchase;
  vm.optimalPO = false;
  vm.selectInventoryArticle = selectInventoryArticle;
  vm.handleChange = handleUIGridChange;
  vm.onChangeUnitCost = onChangeUnitCost;
  vm.setPackaging = setPackaging;
  vm.clearElement = clearElement;

  vm.$invalid = false;

  vm.format = Currencies.format;
  vm.symbol = Currencies.symbol;
  vm.hasMultipleCurrencies = false;
  vm.rate = {
    date : new Date(),
  };

  const cols = [{
    field : 'status',
    width : 25,
    displayName : '',
    cellTemplate : 'modules/purchases/create/templates/status.tmpl.html',
  }, {
    field : 'code',
    width : 150,
    displayName : 'TABLE.COLUMNS.CODE',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/purchases/create/templates/code.tmpl.html',
  }, {
    field : 'description',
    displayName : 'TABLE.COLUMNS.DESCRIPTION',
    headerCellFilter : 'translate',
  }, {
    field : 'unit_type',
    width : 100,
    displayName : 'TABLE.COLUMNS.UNIT',
    headerCellFilter : 'translate',
    cellFilter : 'translate',
  }, {
    field : 'packaging',
    displayName : '',
    width : 40,
    headerCellFilter : 'translate',
    cellFilter : 'translate',
    visible : vm.stockSettings.enable_packaging_pharmaceutical_products,
    cellTemplate : 'modules/purchases/create/templates/packaging.cell.tmpl.html',
  }, {
    field : 'quantity',
    width : 100,
    displayName : 'TABLE.COLUMNS.QUANTITY',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/purchases/create/templates/quantity.tmpl.html',
    type : 'number',
  }, {
    field : 'unit_price',
    width : 105,
    displayName : 'TABLE.COLUMNS.PURCHASE_UNIT_PRICE',
    headerCellFilter : 'translate',
    headerCellClass : 'wrappingColHeader',
    cellTemplate : 'modules/purchases/create/templates/price.tmpl.html',
    type : 'number',
  }, {
    field : 'amount',
    width : 100,
    displayName : 'TABLE.COLUMNS.AMOUNT',
    headerCellFilter : 'translate',
    cellTemplate : 'modules/purchases/create/templates/amount.tmpl.html',
    type : 'number',
  }, {
    field : 'actions',
    width : 30,
    cellTemplate : 'modules/purchases/create/templates/actions.tmpl.html',
  }];

  // grid options for the purchase order grid
  const gridOptions = {
    appScopeProvider : vm,
    enableSorting : false,
    enableColumnMenus : false,
    columnDefs : cols,
    onRegisterApi,
    data : vm.order.store.data,
  };

  vm.selectCurrency = () => {
    try {
      vm.currentExchangeRate = Exchange.getCurrentRate(vm.rate.currency.id);
      vm.order.setCurrencyId(vm.rate.currency.id);
      vm.order.setExchangeRate(vm.currentExchangeRate);
    } catch (err) {
      Notify.danger('EXCHANGE.MUST_DEFINE_RATES_FIRST', 60000);
      vm.rate.currency = vm.currencies.find(curr => curr.id === vm.enterprise.currency_id);
      vm.$invalid = true;
    }
  };

  vm.onChangeShippingHandling = () => {
    vm.order.digest();
  };

  /**
   *
   * @param item
   */
  function selectInventoryArticle(item) {
    vm.order.configureItem(item);
  }

  vm.onSelectRequestedBy = entity => {
    vm.order.details.requested_by = entity.uuid;
    vm.order.details.requested_title = entity.title;
  };

  vm.onSelectReviewed = entity => {
    vm.order.details.reviewed_by = entity.uuid;
    vm.order.details.reviewed_title = entity.title;
  };

  vm.onSelectApprovedBy = entity => {
    vm.order.details.approved_by = entity.uuid;
    vm.order.details.approved_title = entity.title;
  };

  vm.onSelectBeneficiary = entity => {
    vm.order.details.responsible = entity.uuid;
    vm.order.details.responsible_title = entity.title;
  };

  /**
   *
   * @param item
   */
  function onChangeUnitCost(item) {
    // Sanity check on new unit cost
    const previousPurchases = item.stats.median_unit_cost !== null;
    if (previousPurchases) {
      // NOTE: If there are no previous purchases, there is no purchase history to rely on
      // for sanity checks so accept whatever the value is entered
      const medianUnitCost = Number(item.stats.median_unit_cost).toFixed(4);
      const newUnitCost = Number(item.unit_price);
      const allowableMinChange = 0.5; // Warn about entries that are less than half the previous unit cost
      const allowableMaxChange = 2.0; // Warn entries that more than double the previous unit cost
      const lowerUnitCostBound = (medianUnitCost * allowableMinChange);
      const upperUnitCostBound = (medianUnitCost * allowableMaxChange);
      if ((newUnitCost < lowerUnitCostBound) || (newUnitCost > upperUnitCostBound)) {
        const msgParams = { newUnitCost, medianUnitCost, curr : vm.rate.currency.symbol };
        const errMsg1 = newUnitCost > upperUnitCostBound
          ? $translate.instant('WARNINGS.WARN_UNIT_COST_TOO_HIGH', msgParams)
          : $translate.instant('WARNINGS.WARN_UNIT_COST_TOO_LOW', msgParams);
        const errMsg = errMsg1
          .concat($translate.instant('WARNINGS.WARN_UNIT_COST_REASON'))
          .concat($translate.instant('WARNINGS.WARN_UNIT_COST_CONFIRM'));
        Modal.confirm(errMsg)
          .then(() => {
            // Accept the new unit cost into the form
            vm.order.digest();
          })
          .catch(() => {
            // Revert to the zero unit cost in the form and display the warning
            item.unit_price = 0;
            vm.errors = [errMsg1];
            vm.form.$invalid = true;
          });
      }
      return;
    }

    vm.order.digest();
  }

  /**
   * @function setPackaging
   * @param {object} item
   * @description [grid] pop up a modal for defining packaging
   */
  function setPackaging(item) {
    if (!item.inventory_uuid) {
      // Prevent the packaging modal pop-up if new inventory code has been selected
      return;
    }

    StockModal.openSetPackaging({
      item,
      currency_id : vm.currencyId,
    })
      .then((res) => {
        if (!res) { return; }
        item.lots = res.lots;
        item.quantity = res.quantity;
        item.unit_price = res.unit_price;

        item.number_packages = res.number_packages;
        item.package_size = res.package_size;
        item.box_unit_price = res.box_unit_price;

        onChangeUnitCost(item);

      })
      .catch(Notify.handleError);
  }

  // this function will be called whenever items change in the grid.
  /**
   *
   */
  function handleUIGridChange() {
    vm.order.digest();
  }

  // expose the API so that scrolling methods can be used
  /**
   *
   * @param api
   */
  function onRegisterApi(api) {
    vm.gridApi = api;
  }

  // submits the form
  /**
   *
   * @param form
   */
  function submit(form) {
    // make sure form validation is triggered
    form.$setSubmitted();

    // check the form for invalid inputs
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.RECORD_ERROR');
      return 0;
    }

    // check the grid for invalid items
    const invalidItems = vm.order.validate();

    if (invalidItems.length) {
      Notify.danger('PURCHASES.ERRORS.INVALID_ITEMS');

      const firstInvalidItem = invalidItems[0];

      // show the user where the error is in the grid by scrolling to it.
      vm.gridApi.core.scrollTo(firstInvalidItem);
      return 0;
    }

    // Check for duplicated inventory items
    const inventUuids = [];
    let dupItem = null;
    vm.order.store.data.forEach(item => {

      delete item.is_count_per_container;
      delete item.number_packages;
      delete item.box_unit_price;

      // set default inventory package_size
      item.package_size = item.package_size || 1;

      const invUUID = item.inventory_uuid;
      if (inventUuids.includes(invUUID)) {
        dupItem = item;
        return false;
      }
      inventUuids.push(invUUID);
      return false;
    });

    if (dupItem) {
      dupItem._valid = false;
      dupItem._invalid = true;
      vm.gridApi.core.scrollTo(dupItem);
      Notify.danger('ERRORS.ER_DUP_PURCHASE_ORDER_ITEM', 10000);
      return 0;
    }

    // Set Waiting confirmation as default Purchase Order Status
    vm.order.details.status_id = 1;

    // copy the purchase order object into something that can be sent to the server
    const order = angular.copy(vm.order.details);
    order.items = Purchases.preprocessItemsForSubmission(angular.copy(vm.order.store.data));

    vm.loadingState = true;

    const submitFn = vm.isUpdateState
      ? Purchases.update($state.params.uuid, order)
      : Purchases.create(order);

    return submitFn
      .then((res) => {

        if (!vm.isUpdateState) {
          // reset the module
          clear(form);
        }

        // open the receipt modal
        return Receipts.purchase(res.uuid, true);
      })
      .then(() => {
        if (vm.isUpdateState) { $state.go('purchasesCreate'); }
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loadingState = false;
      });
  }

  // clears the module, resetting it
  /**
   *
   * @param form
   */
  function clear(form) {

    // remove the data
    vm.order.setup();

    // if the form was passed in, reset the validation
    if (form) {
      form.$setPristine();
      form.$setUntouched();
    }
  }

  /**
   *
   */
  function optimalPurchase() {
    vm.optimalPO = true;
    const filters = {
      includeEmptyLot : 0,
      period : 'allTime',
      require_po : 1,
    };

    vm.optimalPurchaseLoading = true;

    Stock.inventories.read(null, filters)
      .then(rows => {
        if (!rows.length) {
          return Notify.warn('FORM.INFO.NO_INVENTORY_PO');
        }

        const optimalPurchaseData = vm.order.formatOptimalPurchase(rows);

        // clear the grid as suggested above
        vm.order.clear();
        optimalPurchaseData.forEach((item) => {
          vm.order.store.post(item);
        });

        vm.order.digest();

        return 0;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.optimalPurchaseLoading = false;
      });
  }

  /**
   *
   */
  function startup() {
    clear();
    vm.loadingState = true;

    // Load the currencies and exchange rates
    Currencies.read()
      .then((currencies) => {
        vm.currencies = currencies;

        // use the first currency in the list as the default
        vm.rate.currency = vm.currencies.find(curr => curr.id === vm.enterprise.currency_id);

        // if there are more than a single other currency (besides the enterprise currency)
        // show the currency selection input
        if (vm.currencies.length > 1) {
          vm.hasMultipleCurrencies = true;
        }

        // Update the currency/exchange info
        vm.order.setCurrencyId(vm.rate.currency.id);

        return Exchange.read();
      })
      .then((rates) => {
        vm.rates = rates;
        vm.currentExchangeRate = Exchange.getCurrentRate(vm.rate.currency.id);
        vm.order.setExchangeRate(vm.currentExchangeRate);

        // read the previous purchase order from the database for modification
        if (vm.isUpdateState) {
          // we are using this $q.all() construction to deal with the
          // race condition of not having loaded inventory before
          // trying to set up the purchase form.
          $q.all([
            Purchases.read($state.params.uuid),
            vm.order.ready(),
          ])
            .then(([data]) => {
              vm.order.setupFromPreviousPurchaseOrder(data);
              vm.rate.currency = vm.currencies.find(curr => curr.id === vm.order.details.currency_id);
              vm.currentExchangeRate = Exchange.getCurrentRate(vm.rate.currency.id);
              vm.order.setExchangeRate(vm.currentExchangeRate);
            })
            .catch(err => {
              // if we can't find this uuid, reroute to the create state
              Notify.handleError(err);
              $state.go('purchasesCreate');
            });
        }
      })
      .catch(err => {
        if (err.message === 'EXCHANGE.MISSING_EXCHANGE_RATES') {
          Notify.danger('EXCHANGE.MISSING_EXCHANGE_RATES', 60000);
          vm.$invalid = true;
        } else {
          Notify.handleError(err);
        }
      })
      .finally(() => {
        vm.loadingState = false;
      });
  }

  // bind methods
  vm.gridOptions = gridOptions;
  vm.submit = submit;
  vm.clear = () => {

    // NOTE(@jniles): this is somewhat a hack.  You shouldn't do
    // a complete replacement of the form during an update, so if
    // you clear the form, we just send you to the creation state.
    if (vm.isUpdateState) { $state.go('purchasesCreate'); }
    clear();
  };

  // clears search parameters.  Custom logic if a date is used so that we can clear two properties
  /**
   *
   * @param value
   */
  function clearElement(value) {
    delete vm.order.details[value];
  }

  vm.cancel = () => {
    $state.go('purchasesRegistry');
  };

  startup();
}
