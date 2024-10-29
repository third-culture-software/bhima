angular.module('bhima.services')
  .service('CashFormService', CashFormService);

CashFormService.$inject = [
  'appcache', 'SessionService', 'PatientService', 'ExchangeRateService',
];

function CashFormService(AppCache, Session, Patients, Exchange) {

  // sets the default payment type is an invoice payment
  const DEFAULT_PAYMENT_TYPE = 0;

  // @contructor
  function CashForm(cacheKey) {
    this.cache = new AppCache(`CashForm - ${cacheKey}`);

    this.setup();

    // make sure we have exchange rates available
    Exchange.read();
  }

  /**
   * @method setup
   *
   * @description
   * This method refreshes the cash payments form data.
   */
  CashForm.prototype.setup = function setup() {
    this.details = { date : new Date(), description : '', invoices : [] };
    this.details.currency_id = Session.enterprise.currency_id;
    this.hasPrepaymentSupport = Session.enterprise.settings.enable_prepayments;

    // load the caution type from memory or default
    this.setCautionType(this.cache.isCaution || DEFAULT_PAYMENT_TYPE);

    // if there is no prepayment support, remove caution payment option
    if (!this.hasPrepaymentSupport) {
      this.setCautionType(0);
    }

    // this is for any messages/warnings/errors
    this.messages = {};

    // this is for totals values of invoices
    this.totals = {};
  };

  /**
   * @method isInEnterpriseCurrency
   *
   * @description
   * Returns true of uses the enterprise currency.
   */
  CashForm.prototype.isInEnterpriseCurrency = function isInEnterpriseCurrency() {
    return this.details.currency_id === Session.enterprise.currency_id;
  };

  CashForm.prototype.onDateChange = function onDateChange(date) {
    this.details.date = date;
  };

  /**
   * @method setCautionType
   *
   * @description
   * This method takes in boolean value and assigns it to the caution type of the
   * cash form.  It also stores the selection in AppCache.
   */
  CashForm.prototype.setCautionType = function setCautionType(isCaution) {

    // change the form value
    this.details.is_caution = isCaution;

    // cache the previous value across refreshes
    this.cache.isCaution = isCaution;

    // if it is caution, remove all invoices
    if (!isCaution) {
      this.details.invoices.length = 0;
    }
  };

  /**
   * @method isCaution
   *
   * @description
   * This method returns the is_caution field in a nice boolean form.
   */
  CashForm.prototype.isCaution = function isCaution() {
    return Boolean(this.details.is_caution);
  };

  /**
   * @method setPatient
   *
   * @description
   * This method takes in a patient and sets the form's debtor_uuid as needed.
   * It also looks up to confirm if the patient has a caution to alert the user.
   */
  CashForm.prototype.setPatient = function setPatient(patient) {
    const self = this;

    this.patient = patient;
    this.details.debtor_uuid = patient.debtor_uuid;

    return Patients.balance(patient.uuid)
      .then((balance) => {
        const patientAccountBalance = balance * -1;
        self.messages.hasPositiveAccountBalance = patientAccountBalance > 0;
        self.messages.patientAccountBalance = patientAccountBalance;

        if (patient.is_convention) {
          self.messages.isNonCashPatient = true;
          self.messages.patientName = ''.concat('[', patient.reference, '] ', patient.display_name);
          self.messages.patientConventionName = patient.debtor_group_name;
        }

        self.digest();
      });
  };

  /**
   * @method configure
   *
   * @description
   * This is a convenience method for setting the form properties from an
   * object passed into the form.
   */
  CashForm.prototype.configure = function configure(config) {

    if (config.patient) {
      this.setPatient(config.patient);
    }

    if (config.description) {
      this.details.description = config.description;
    }

    if (config.cashbox) {
      this.setCashbox(config.cashbox);
    }

    if (config.currency_id) {
      this.setCurrency({ id : config.currency_id });
    }

    if (config.is_caution) {
      this.setCautionType(config.is_caution);
    }

    if (config.invoices) {
      this.setInvoices(config.invoices);
    }
  };

  /**
   * @method setCashbox
   *
   * @description
   * Sets the cashbox id on the payment details object.
   */
  CashForm.prototype.setCashbox = function setCashbox(cashbox) {
    this.details.cashbox_id = cashbox.id;
    this.digest();
  };

  /**
   * @method setInvoices
   *
   * @description
   * This method takes in a list of invoices and calculates the totals due on them
   * for the cash payment form via the digest() call.
   */
  CashForm.prototype.setInvoices = function setInvoices(invoices) {
    this.details.invoices = invoices;

    // runs the totals and exchange calculation
    this.digest();
  };

  /**
   * @method setCurrency
   *
   * @description
   * Sets the currency and immediately digests
   */
  CashForm.prototype.setCurrency = function setCurrency(currency) {
    this.details.currency_id = currency.id;
    this.digest();
  };

  /**
   * @method digest
   *
   * @description
   * This method will compute the exchange rate and
   */
  CashForm.prototype.digest = function digest() {
    this.details.invoices = this.details.invoices || [];

    // first total the invoice
    const total = this.details.invoices.reduce((aggregate, invoice) => {
      return aggregate + invoice.balance;
    }, 0);

    // bind the enterprise currency value
    this.totals.enterpriseCurrencyTotal = total;
    this.totals.currentExchangeRate = Exchange.getExchangeRate(this.details.currency_id, this.details.date);
    this.totals.foreignCurrencyTotal = total * this.totals.currentExchangeRate;
  };

  return CashForm;
}
