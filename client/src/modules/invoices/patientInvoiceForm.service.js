angular.module('bhima.services')
  .service('PatientInvoiceForm', PatientInvoiceFormService);

PatientInvoiceFormService.$inject = [
  'PatientService', 'PriceListService', 'InventoryService', 'AppCache', 'Store',
  'Pool', 'PatientInvoiceItemService', 'bhConstants', 'ServiceService', '$q',
  '$translate', 'NotifyService', '$timeout', '$document', 'AccountService',
  'DebtorGroupService',
];

/**
 * @class PatientInvoiceForm
 *
 * @description
 * The PatientInvoiceForm class manages the totalling, caching, and validation associated
 * with the Patient PatientInvoiceForm module.  You must specify a cacheKey to enable the
 * class to be instantiated correctly.
 *
 * @todo (required) only the maximum of the bill should be subsidised
 * @todo (required) invoicing fees and subsidies should be ignored for
 *   specific debtors.
 */
function PatientInvoiceFormService(
  Patients, PriceLists, Inventory, AppCache, Store, Pool, PatientInvoiceItem,
  Constants, Services, $q, $translate, Notify, $timeout, $document, Accounts, DebtorGroups,
) {
  const { ROW_ERROR_FLAG } = Constants.grid;
  const DEFAULT_SERVICE_IDX = 0;
  const DESCRIPTION_KEY = 'PATIENT_INVOICE.DESCRIPTION';

  // Reduce method - assigns the current invoicing fees charge to the invoicing
  // fee and adds to the running total
  function calculateInvoicingFees(invoicingFees, total) {
    return invoicingFees.reduce((current, invoicingFee) => {
      invoicingFee.charge = (total / 100) * invoicingFee.value;
      return current + invoicingFee.charge;
    }, 0);
  }

  // This is a separate(very similar) method to calculating invoicing fees
  // as subsidies will require additional logic to limit subsidising more then 100%
  function calculateSubsidies(subsidies, total) {
    // All values are percentages
    return subsidies.reduce((current, subsidy) => {
      subsidy.charge = (total / 100) * subsidy.value;
      return current + subsidy.charge;
    }, 0);
  }

  // this method calculates the base invoice cost by summing all the items in
  // the invoice.  To make sure that items are correctly counted, it validates
  // each row before processing it.
  function calculateBaseInvoiceCost(items) {
    return items.reduce((aggregate, row) => {
      row.validate();

      // only sum valid rows
      if (row._valid) {
        row.credit = (row.quantity * row.transaction_price);
        return aggregate + row.credit;
      }

      return aggregate;
    }, 0);
  }

  function setDefaultService() {
    const hasServices = angular.isDefined(this.services) && this.services.length;

    if (hasServices) {
      this.details.service_uuid = this.services[DEFAULT_SERVICE_IDX].uuid;
    }
  }

  /**
   * @constructor
   *
   * @description
   * This function constructs a new instance of the PatientInvoiceForm class.
   *
   * @param {String} cacheKey - the AppCache key under which to store the
   *   invoice.
   */
  function PatientInvoiceForm(cacheKey) {
    if (!cacheKey) {
      throw new Error('PatientInvoiceForm expected a cacheKey, but it was not provided.');
    }

    // bind the cache key
    this.cache = AppCache(cacheKey);

    // set up the inventory
    // this will be referred to as PatientInvoiceForm.inventory.available.data
    this.inventory = new Pool({ identifier : 'uuid', data : [] });

    // set up the services
    // TODO(@jniles) - migrate this to a bh-service-select
    Services.read()
      .then(services => {
        this.services = services;

        // compute the default service once
        setDefaultService.call(this);
      });

    // set up the inventory
    Inventory.read(null, { detailed : 1, locked : 0, skipTags : true })
      .then(data => {
        if (data.length === 0) {
          Notify.danger('INVENTORY.NO_INVENTORY_REGISTERED');
          return;
        }
        // make sure both the label and code is searchable
        data.forEach(item => {
          item.hrlabel = ''.concat(item.code, ' ', item.label);
        });

        this.inventory.initialize('uuid', data);
      });

    // setup the rows of the grid as a store
    // this will be referred to as PatientInvoiceForm.store.data
    this.store = new Store({ identifier : 'uuid', data : [] });

    this.setup();
  }

  // initial setup and clearing of the invoice
  PatientInvoiceForm.prototype.setup = function setup() {
    // the invoice details
    this.details = {
      date : new Date(),
      cost : 0,
      description : null,
    };

    // tracks the price list of the inventory items
    this.prices = new Store({ identifier : 'inventory_uuid' });

    // reset the error message
    this._error = null;

    // the recipient is null
    this.recipient = null;

    // this object holds the abstract properties of the invoice
    this.invoicingFees = [];
    this.subsidies = [];

    // this object holds the totals for the invoice.
    this.totals = {
      invoicingFees : 0,
      subsidies : 0,
      rows : 0,
      grandTotal : 0,
    };

    // remove all items from the store as needed
    this.clear();

    this._valid = false;
    this._invalid = true;

    // trigger a totals digest
    this.digest();
  };

  /**
   * @method validate
   *
   * @description
   * This method digests the invoice, then returns all invalid items in the
   * invoice to be dealt with by the user.
   *
   * @param {Boolean} highlight - determines if the ROW_ERROR_FLAG should be set
   *   to highlight errors on the grid.
   */
  PatientInvoiceForm.prototype.validate = function validate(highlight) {
    this.digest();

    // TODO(@jniles): eventually, we should develop a better data model for these errors.
    // Currently, we only have two "global" errors: (1) patients with creditor balances and
    // (2) overdrafts on patient debtor groups.
    let globalConfigurationError = null;

    // filters out valid items
    const invalidItems = this.store.data.filter(row => {
      row[ROW_ERROR_FLAG] = highlight ? row._invalid : false;

      // this sets the global configuration error if there is no sales account
      // and the row has already been configured.
      if (row._initialised && !row._hasSalesAccount) {
        globalConfigurationError = row._message;
      }

      return row._invalid;
    });

    this._invalid = invalidItems.length > 0;
    this._valid = !this._invalid;

    // if the accountOverdraftErrMsg is set, then the account has been overdrafted and we should
    // show that error message
    this._error = this._accountOverdraftErrMsg || globalConfigurationError;
    this._error_values = this._accountOverdraftErrMsgValues || {};

    return invalidItems;
  };

  /**
  * @method checkAccountOverdraft
  *
  * @description
  * Ensures that the patient account doesn't have an overdraft limit that
  * would block the invoicing of this patient.
  *
  * NOTE(@jniles): this "fails open", that is to say, we cannot get the balance for some reason,
  * it will allow the user to continue to make an invoice.  We'll rely on the server's logic to
  * catch the mistake.
  */
  function checkAccountOverdraft(patient) {
    return $q.all([
      // include the posting journal here so that we can dynamically ensure that we don't overdraft the account.
      Accounts.getBalance(patient.account_id, { journal : 1 }),
      DebtorGroups.read(patient.debtor_group_uuid),
    ]).then(([{ balance }, debtorGroup]) => {

      // signal to the user that there is an issue if the account has been overdrafted.
      if (debtorGroup.max_debt > 0 && balance >= debtorGroup.max_debt) {
        this._accountOverdraftErrMsg = 'DEBTOR_GROUP.ERRORS.OVERDRAFT_LIMIT_EXCEEDED';

        // TODO(@jniles) - ideally, this should provice a way to register the enterprise currency
        // and display the balances to the user in the enterprise currency.
        this._accountOverdraftErrMsgValues = {
          debtorGroupBalance : balance,
          debtorGroupName : debtorGroup.name,
          patientName : patient.display_name,
          debtorGroupMaxDebt : debtorGroup.max_debt,
          currencyId : this.enterprise.currency_id,
        };
      } else {
        delete this._accountOverdraftErrMsg;
        delete this._accountOverdraftErrMsgValues;
      }

      this.validate();
    });
  }

  PatientInvoiceForm.prototype.setEnterprise = function setEnterprise(enterprise) {
    this.enterprise = enterprise;
  };

  /**
   * @method setPatient
   *
   * @description
   * This method downloads the patient's invoicing fees, price lists, and
   * subsidies to be applied to the bill.  It sets also sets the `recipient`
   * and `debtor_uuid` properties on the invoice.
   *
   * NOTE(@jniles): you must call setEnterprise() before setting the patient!
   *
   * @param {Object} patient - a patient object as read out of the database.
   */
  PatientInvoiceForm.prototype.setPatient = function setPatient(patient) {
    const invoice = this;
    const promises = [];

    // fire off the debtor group account overdraft checks
    promises.push(checkAccountOverdraft.call(this, patient));

    // load the invoicing fees and bind to the invoice
    const invoicingFeePromise = Patients.invoicingFees(patient.uuid)
      .then(invoicingFees => {
        invoice.invoicingFees = invoicingFees;
      });

    promises.push(invoicingFeePromise);

    // load the subsidies and bind to the invoice
    const subsidyPromise = Patients.subsidies(patient.uuid)
      .then(subsidies => {
        invoice.subsidies = subsidies;
      });

    promises.push(subsidyPromise);

    // the patient's price list when complete
    if (patient.price_list_uuid) {
      const priceListPromise = PriceLists.read(patient.price_list_uuid)
        .then(priceList => {
          invoice.setPriceList(priceList);
        });

      promises.push(priceListPromise);
    }

    promises.push(Patients.balance(patient.uuid)
      .then(balance => {
        // NOTE - a patient with no invoices will have a null balance.
        if (balance) {
          invoice.recipient.hasCreditorBalance = balance.credit > balance.debit;
          invoice.recipient.balance = Math.abs(balance.balance);
        }
      }));

    invoice.recipient = patient;
    invoice.details.debtor_uuid = patient.debtor_uuid;

    // add a single item to the invoice to begin
    invoice.addItem();

    // once all HTTP requests have returned, re-digest the invoice.
    $q.all(promises)
      .finally(() => invoice.digest());

    // run validation and calculation
    invoice.digest();
  };

  /**
   * @method setPriceList
   *
   * @description
   * This method sets the inventory price list for the patient.
   *
   * @param {Object} priceList - a list of prices loaded based on the patient's
   * group affiliations.
   */
  PatientInvoiceForm.prototype.setPriceList = function setPriceList(priceList) {
    this.prices.setData(priceList.items);
  };

  /**
   * @method setService
   *
   * @description
   * This method simply sets the `service_uuid` property of the invoice.
   *
   * @param {Object} service - a service object as read from the database
   */
  PatientInvoiceForm.prototype.setService = function setService(service) {
    this.service = service;
    this.details.service_uuid = service.uuid;
  };

  /**
   * @method getTemplatedDescription
   *
   * @description
   * This method return the description based on the currently selected service and items
   * in the invoice.
   */
  PatientInvoiceForm.prototype.getTemplatedDescription = function getTemplatedDescription() {
    let selectedService;

    // compute the selected service
    this.services.forEach(service => {
      if (service.uuid === this.details.service_uuid) {
        selectedService = service;
      }
    });

    return $translate.instant(DESCRIPTION_KEY, {
      patientName : this.recipient.display_name,
      patientReference : this.recipient.reference,
      numItems : this.store.data.length,
      serviceName : selectedService.name,
      description : this.details.description,
    });
  };

  /**
   * @method digest
   *
   * @description
   * Calculates the totals for the invoice by:
   *  1) Summing all the values in the grid (invoice items)
   *  2) Calculating the additions due to invoicing fees
   *  3) Calculating the reductions due to subsidies
   *  4) Reporting the "grand total" owed after all are applied
   *
   * This method should be called anytime the values of the grid change,
   * and on setPatient() completion.
   */
  PatientInvoiceForm.prototype.digest = function digest() {
    const invoice = this;
    const { totals } = invoice;
    let grandTotal = 0;

    // PatientInvoiceForm cost as modelled in the database does not factor in invoicing fees
    // or subsidies
    const baseCost = calculateBaseInvoiceCost(this.store.data);
    totals.rows = baseCost;
    invoice.details.cost = baseCost;
    grandTotal += baseCost;

    // calculate the invoicing fees total and increase the bill by that much
    totals.invoicingFees = calculateInvoicingFees(invoice.invoicingFees, grandTotal);
    grandTotal += totals.invoicingFees;

    // calculate the subsidies total and decrease the bill by that much
    totals.subsidies = calculateSubsidies(invoice.subsidies, grandTotal);
    grandTotal -= totals.subsidies;

    // bind the grandTotal
    totals.grandTotal = grandTotal;
  };

  // clears the store of items
  PatientInvoiceForm.prototype.clear = function clear() {
    const invoice = this;

    // copy the data so that forEach() doesn't get confused.
    const cp = angular.copy(this.store.data);

    // remove each item from the store
    cp.forEach((item) => invoice.removeItem(item));
  };

  /*
   * PatientInvoiceForm Item Methods
   */

  /**
   * @method addItem
   *
   * @description
   * Adds a new PatientPatientInvoiceFormItem to the store.  If the inventory is all used
   * up, return silently.  This is so that we do not add rows that cannot be
   * configured with inventory items.
   */
  PatientInvoiceForm.prototype.addItem = function addItem() {
    const maxRows = this.inventory.size();
    // we cannot insert any row if there's no inventory registered
    if (maxRows === 0) {
      Notify.danger('INVENTORY.NO_INVENTORY_REGISTERED');
      return null;
    }
    // we cannot insert more rows than our max inventory size
    if (this.store.data.length >= maxRows) {
      return null;
    }

    // add the item to the store
    const item = new PatientInvoiceItem();
    this.store.post(item);

    // return a reference to the item
    return item;
  };

  /**
   * @method removeItem
   *
   * @description
   * Removes a specific item from the store. If the item has been configured,
   * also release the associated inventory item so that it may be used again.
   *
   * @param {Object} item - the item/row to be removed from the store
   */
  PatientInvoiceForm.prototype.removeItem = function removeItem(item) {
    this.store.remove(item.uuid);
    if (item.inventory_uuid) {
      this.inventory.release(item.inventory_uuid);
    }
    this.digest();
  };

  /**
   * @method configureItem
   *
   * @description
   * New items still need to be configured with references to the inventory item
   * that is being invoiced.  This method attaches the inventory_uuid to the
   * item, removes the referenced inventory item from the pool, and sets the
   * price of the item based on the patient's price list.
   *
   * @param {Object} item - the item/row to be configured
   */
  PatientInvoiceForm.prototype.configureItem = function configureItem(item) {
    // remove the item from the pool
    const inventoryItem = this.inventory.use(item.inventory_uuid);

    // configure the PatientPatientInvoiceFormItem with the inventory values
    item.configure(inventoryItem);

    // apply the price list, if it exists
    const price = this.prices.get(item.inventory_uuid);
    if (angular.isDefined(price)) {
      item.applyPriceList(price);
    }

    // set focus on quantity field
    $timeout(() => {
      $document[0].getElementById(item.uuid).focus();
    }, 100);

    // make sure to validate and calculate new totals
    this.digest();

    // check for global configuration errors
    this.validate();
  };

  /**
   * @method readCache
   *
   * @description
   * This method reads the values out of the application cache and into the
   * patient invoice.  After reading the value, it re-digests the invoice to
   * perform validation and computer totals.
   */
  PatientInvoiceForm.prototype.readCache = function readCache() {
    // copy the cache temporarily
    const cp = angular.copy(this.cache);

    // set the details to the cached ones
    this.details = cp.details;
    this.details.date = new Date(this.details.date);

    // set the patient
    this.setPatient(cp.recipient);

    // setPatient() adds an item.  Remove it before configuring data
    this.clear();

    // loop through the cached items, configuring them
    cp.items.forEach((cacheItem) => {
      const item = this.addItem();

      item.inventory_uuid = cacheItem.inventory_uuid;
      this.configureItem(item);

      item.quantity = cacheItem.quantity;
      item.transaction_price = cacheItem.transaction_price;
    });

    this.hasRecoveredCache = true;

    // digest validation and totals
    this.digest();
  };

  /**
   * @method writeCache
   *
   * @description
   * This method writes values from the invoice into the application cache for
   * later recovery.
   */
  PatientInvoiceForm.prototype.writeCache = function writeCache() {
    this.cache.details = this.details;
    this.cache.recipient = this.recipient;
    this.cache.items = angular.copy(this.store.data);
  };

  /**
   * @method clearCache
   *
   * @description
   * This method deletes the items from the application cache.
   */
  PatientInvoiceForm.prototype.clearCache = function clearCache() {
    delete this.cache.details;
    delete this.cache.recipient;
    delete this.cache.items;
  };

  /**
   * @method hasCacheAvailable
   *
   * @description
   * Checks to see if the invoice has cached items to recover.
   */
  PatientInvoiceForm.prototype.hasCacheAvailable = function hasCacheAvailable() {
    return Object.keys(this.cache).length > 0;
  };

  return PatientInvoiceForm;
}
