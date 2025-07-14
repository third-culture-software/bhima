/* global inject, expect, chai */
/* eslint no-unused-expressions:off */
describe('test/client-unit/services/CashFormService', () => {
  let CashFormService;
  let Mocks;
  let Session;
  let Exchange;
  let Patients;
  let form;
  let $rootScope;
  let httpBackend;

  // Mock data
  const enterprise = {
    currency_id : 1, // USD
    settings : { enable_prepayments : true },
  };

  const exchangeRates = {
    1 : { rate : 1.0 }, // USD
    2 : { rate : 0.9 }, // EUR
  };

  const sandbox = chai.spy.sandbox();

  beforeEach(module(
    'bhima.services',
    'bhima.constants',
    'angularMoment',
    'ui.bootstrap',
    'ui.router',
    'ngStorage',
    'pascalprecht.translate',
    'tmh.dynamicLocale',
    'bhima.mocks',
  ));

  beforeEach(inject((
    _CashFormService_,
    _MockDataService_,
    _SessionService_,
    _ExchangeRateService_,
    _PatientService_,
    _$rootScope_,
    _$httpBackend_,
  ) => {
    CashFormService = _CashFormService_;
    Mocks = _MockDataService_;
    Session = _SessionService_;
    Exchange = _ExchangeRateService_;
    Patients = _PatientService_;
    $rootScope = _$rootScope_;
    httpBackend = _$httpBackend_;

    // Setup mocks and spies
    chai.spy.on(Exchange, 'read');
    chai.spy.on(Exchange, 'getExchangeRate',
      (currencyId) => (exchangeRates[currencyId] ? exchangeRates[currencyId].rate : 1.0));
    chai.spy.on(Patients, 'balance', () => Promise.resolve(0));

    // Create a mock session
    Session.create(Mocks.user(), structuredClone(enterprise), Mocks.stock_settings(), Mocks.project());

    const rates = [{
      id : 1,
      enterprise_id : enterprise.id,
      currency_id : 1,
      rate : 800,
      date : new Date('01-01-2000'),
    }, {
      id : 2,
      enterprise_id : enterprise.id,
      currency_id : 2,
      rate : 1200,
      date : new Date('01-01-2001'),
    }, {
      id : 3,
      enterprise_id : enterprise.id,
      currency_id : 2,
      rate : 1500,
      date : new Date('01-01-2010'),
    }, {
      id : 4,
      enterprise_id : enterprise.id,
      currency_id : 2,
      rate : 2000,
      date : new Date('01-02-2010'),
    }, {
      id : 5,
      enterprise_id : enterprise.id,
      currency_id : 3,
      rate : 0.84,
      date : new Date('01-02-2010'),
    }];

    const currencies = [{
      id : 1,
      symbol : 'FC',
      format_key : 'fc',
      name : 'Congolese Francs',
      min_monentary_unit : 50,
    }, {
      id : 2,
      symbol : 'USD',
      format_key : 'usd',
      name : 'US Dollars',
      min_monentary_unit : 0.01,
    }, {
      id : 3,
      symbol : '€',
      format_key : 'EUR',
      name : 'Euro',
      min_monentary_unit : 0.01,
    }];

    httpBackend.when('GET', '/exchange')
      .respond(rates);

    httpBackend.when('GET', '/currencies')
      .respond(currencies);

    form = new CashFormService('TestKey');

    // flush the exchange request
    httpBackend.flush();
  }));

  afterEach(() => {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
    sandbox.restore();
  });

  context('#constructor()', () => {
    it('should call setup on initialization', () => {
      const setupSpy = chai.spy(CashFormService.prototype, 'setup');
      const newForm = new CashFormService('NewKey'); // eslint-disable-line no-unused-vars
      httpBackend.flush(); // Ensure all requests are resolved
      expect(setupSpy).to.have.been.called;
    });

    it('should call Exchange.read() on initialization', () => {
      expect(Exchange.read).to.have.been.called;
    });

    it('should initialize with default details from Session', () => {
      expect(form.details.currency_id).to.equal(Session.enterprise.currency_id);
      expect(form.details.date).to.be.an.instanceof(Date);
      expect(form.hasPrepaymentSupport).to.be.true;
    });
  });

  it('#setup() should disable caution payments if hasPrepaymentSupport is false', () => {
    Session.enterprise.settings.enable_prepayments = false;
    form.setup();
    expect(form.hasPrepaymentSupport).to.be.false;
    expect(form.details.is_caution).to.equal(0);
  });

  it('#isInEnterpriseCurrency() should return true when currency is the enterprise currency', () => {
    form.details.currency_id = 1; // Enterprise currency
    expect(form.isInEnterpriseCurrency()).to.be.true;
  });

  it('#isInEnterpriseCurrency() should return false when currency is not the enterprise currency', () => {
    form.details.currency_id = 2; // Foreign currency
    expect(form.isInEnterpriseCurrency()).to.be.false;
  });

  it('#onDateChange() should update the details date', () => {
    const newDate = new Date('2024-01-01');
    form.onDateChange(newDate);
    expect(form.details.date).to.equal(newDate);
  });

  it('#setCautionType() should set the caution type and update cache', () => {
    form.setCautionType(1);
    expect(form.details.is_caution).to.equal(1);
    expect(form.cache.isCaution).to.equal(1);
    expect(form.isCaution()).to.be.true;
  });

  it('#setCautionType() should clear invoices if caution type is set to false', () => {
    form.details.invoices = [{ id : 1 }];
    form.setCautionType(0);
    expect(form.details.invoices).to.have.length(0);
    expect(form.isCaution()).to.be.false;
  });

  describe('#setPatient()', () => {
    const patient = { uuid : 'patient-uuid-1', debtor_uuid : 'debtor-uuid-1' };

    it('should set patient details and fetch balance', async () => {

      chai.spy.restore(Patients, 'balance');
      chai.spy.on(Patients, 'balance', () => Promise.resolve(-100));

      // Patients.balance.withArgs(patient.uuid).resolves(-100); // balance is negative
      await form.setPatient(patient);

      $rootScope.$digest(); // Resolve promises

      expect(form.patient).to.equal(patient);
      expect(form.details.debtor_uuid).to.equal(patient.debtor_uuid);
      expect(Patients.balance).to.have.been.called.with(patient.uuid);
      expect(form.messages.hasPositiveAccountBalance).to.be.true;
      expect(form.messages.patientAccountBalance).to.equal(100);
    });

    it('should set convention patient messages correctly', async () => {
      const conventionPatient = {
        ...patient,
        is_convention : true,
        reference : 'C123',
        display_name : 'John Doe',
        debtor_group_name : 'Convention XYZ',
      };

      await form.setPatient(conventionPatient);
      $rootScope.$digest();

      expect(form.messages.isNonCashPatient).to.be.true;
      expect(form.messages.patientName).to.equal('[C123] John Doe');
      expect(form.messages.patientConventionName).to.equal('Convention XYZ');
    });
  });

  it('#configure() should configure form properties from a config object', () => {
    chai.spy.on(form, 'setPatient');

    const config = {
      patient : { uuid : 'p1' },
      description : 'Test Description',
      cashbox : { id : 'c1' },
      currency_id : 2,
      is_caution : 1,
      invoices : [{ balance : 50 }],
    };

    form.configure(config);

    expect(form.setPatient).to.have.been.called.with(config.patient);
    expect(form.details.description).to.equal(config.description);
    expect(form.details.cashbox_id).to.equal(config.cashbox.id);
    expect(form.details.currency_id).to.equal(config.currency_id);
    expect(form.details.is_caution).to.equal(config.is_caution);
    expect(form.details.invoices).to.deep.equal(config.invoices);
  });

  it('#setInvoices() should set invoices and call digest', () => {
    const digestSpy = chai.spy(form.digest);
    const invoices = [{ balance : 100 }, { balance : 200 }];
    form.setInvoices(invoices);

    expect(form.details.invoices).to.deep.equal(invoices);
    expect(digestSpy).to.have.been.called;
  });

  it('#setCurrency() should set currency and call digest', () => {
    const digestSpy = chai.spy(form.digest);
    form.setCurrency({ id : 2 }); // EUR

    expect(form.details.currency_id).to.equal(2);
    expect(digestSpy).to.have.been.called;
  });

  it('#digest() should calculate totals correctly for enterprise currency', () => {
    form.details.currency_id = 1; // Enterprise currency (USD)
    form.details.invoices = [{ balance : 150 }, { balance : 50 }];
    form.digest();

    expect(form.totals.enterpriseCurrencyTotal).to.equal(200);
    expect(form.totals.currentExchangeRate).to.equal(1.0);
    expect(form.totals.foreignCurrencyTotal).to.equal(200);
  });

  it('#digest() should calculate totals correctly for a foreign currency', () => {
    form.details.currency_id = 2; // Foreign currency (EUR)
    form.details.invoices = [{ balance : 150 }, { balance : 50 }];
    form.digest();

    expect(form.totals.enterpriseCurrencyTotal).to.equal(200);
    expect(form.totals.currentExchangeRate).to.equal(0.9);
    expect(form.totals.foreignCurrencyTotal).to.equal(180); // 200 * 0.9
  });

  it('#digest() should handle an empty invoice list', () => {
    form.details.invoices = [];
    form.digest();

    expect(form.totals.enterpriseCurrencyTotal).to.equal(0);
    expect(form.totals.foreignCurrencyTotal).to.equal(0);
  });
});
