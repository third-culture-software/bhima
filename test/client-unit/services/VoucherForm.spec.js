/* global inject, expect, chai */
/* eslint no-unused-expressions:off */
describe('test/client-unit/services/VoucherForm', () => {
  let VoucherForm;
  let httpBackend;
  let Session;
  let form;
  let Mocks;
  let $timeout;
  let $translate;
  let Exchange;

  const sandbox = chai.spy.sandbox();

  beforeEach(module(
    'bhima.services',
    'angularMoment',
    'ui.bootstrap',
    'ui.router',
    'bhima.constants',
    'ngStorage',
    'pascalprecht.translate',
    'tmh.dynamicLocale',
    'bhima.mocks',
  ));

  beforeEach(inject((
    _VoucherForm_,
    $httpBackend,
    _SessionService_,
    _MockDataService_,
    _ExchangeRateService_,
    _$timeout_,
    _$translate_,
  ) => {
    VoucherForm = _VoucherForm_;
    Session = _SessionService_;
    Mocks = _MockDataService_;
    Exchange = _ExchangeRateService_;
    $timeout = _$timeout_;
    $translate = _$translate_;

    // set up the required properties for the session
    Session.create(Mocks.user(), Mocks.enterprise(), Mocks.stock_settings(), Mocks.project());

    httpBackend = $httpBackend;

    httpBackend.when('GET', '/accounts/')
      .respond(200, Mocks.accounts());

    form = new VoucherForm('TestKey');
  }));

  // make sure $http is clean after tests
  afterEach(() => {
    $timeout.flush();
    httpBackend.flush();
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
    sandbox.restore();
  });

  context('#constructor()', () => {
    let constructorForm;
    let setupSpy;

    before(() => {
      constructorForm = new VoucherForm('TestCacheKey');
      setupSpy = chai.spy.on(constructorForm, 'setup');
    });

    it('#constructor() calls #setup() on initialization', () => {
      expect(setupSpy).to.have.been.called;
    });

    it('#constructor() creates a new store with two items in it', () => {
      expect(constructorForm.store).to.exist;
      expect(constructorForm.store.identifier).to.equal('uuid');

      // two rows should be added
      expect(constructorForm.store.data).to.have.length(2);
    });

    it('#constructor() sets default data based on Session', () => {
      expect(constructorForm.details).to.exist;
      expect(constructorForm.details.project_id).to.be.equal(Session.project.id);
      expect(constructorForm.details.currency_id).to.be.equal(Session.enterprise.currency_id);
      expect(constructorForm.details.user_id).to.be.equal(Session.user.id);
    });
  });

  it('#removeItem() removes a specific uuid from the store', () => {
    // there must be 2 items by default in the store
    const item = form.store.data[1];
    form.removeItem(item.uuid);

    expect(form.store.data).to.have.length(1);
    expect(form.store.get(item.uuid)).to.be.undefined;
  });

  it.skip('#addItems() adds multiple rows to the store', () => {
    form.addItems(13);
    expect(form.store.data).to.have.length(15);
  });

  it('#clear() removes all data from the internal store', () => {
    form.clear();
    expect(form.store.data).to.have.length(0);
  });

  it('#hasCacheAvailable() should be false by default', () => {
    expect(form.hasCacheAvailable()).to.equal(false);
  });

  it('#writeCache() should make #hasCacheAvailable() true', () => {
    form.writeCache();
    expect(form.hasCacheAvailable()).to.equal(true);
  });

  it('#clearCache() should make #hasCacheAvailable() false', () => {
    form.writeCache();
    form.clearCache();
    expect(form.hasCacheAvailable()).to.equal(false);
  });

  it('#onChanges() calls #validate()', () => {
    chai.spy.on(form, 'validate');
    form.onChanges();
    expect(form.validate).to.have.been.called.exactly(1);
  });

  it('#validate() calculate totals', () => {
    form.validate();
    expect(form.totals).to.eql({ debit : 0, credit : 0 });

    // grab both items and configure them
    const [firstItem, secondItem] = form.store.data;

    firstItem.debit = 10;
    firstItem.credit = 0;
    secondItem.debit = 0;
    secondItem.credit = 10;

    form.validate();
    expect(form.totals).to.eql({ debit : 10, credit : 10 });
  });

  it('#handleCurrencyChange updates currency_id and optionally converts values', () => {
    form.store.data[0].debit = 100;
    form.details.currency_id = 1;
    const newCurrencyId = 2;
    const conversionRate = 2;

    form.details = { currency_id : 1, date : new Date() };

    chai.spy.on(form, 'validate');
    chai.spy.on(Exchange, 'getExchangeRate', () => conversionRate);
    chai.spy.on(Exchange, 'round', (val) => Math.round(val));

    form.handleCurrencyChange(newCurrencyId, true);

    expect(form.details.currency_id).to.equal(newCurrencyId);
    expect(form.store.data[0].debit).to.equal(200);
    expect(form.validate).to.have.been.called;
  });

  it('#replaceFormRows clears and repopulates rows, calls validate', () => {
    chai.spy.on(form, 'validate');
    chai.spy.on(form, 'clear');
    chai.spy.on(form, 'addItems');

    const rows = [{ debit : 1 }, { credit : 2 }];

    form.replaceFormRows(rows);

    expect(form.clear).to.have.been.called.once;
    expect(form.addItems).to.have.been.called.exactly(2);
    expect(form.validate).to.have.been.called.once;
  });

  it('#setAccountOnRow configures the row with account_id', () => {
    const row = { configure : chai.spy() };
    form.setAccountOnRow(row, 123);
    expect(row.configure).to.have.been.called.with({ account_id : 123 });
  });

  it('#onDateChange sets details.date', () => {
    const newDate = new Date(2020, 1, 1);
    form.onDateChange(newDate);
    expect(form.details.date).to.eql(newDate);
  });

  it('#configureRow calls configure on the row', () => {
    const row = { configure : chai.spy() };
    form.configureRow(row);
    expect(row.configure).to.have.been.called.with(row);
  });

  it('#clear resets _error state', () => {
    form._error = 'SOME_ERROR';
    form.clear();
    $timeout.flush();
    expect(form._error).to.be.undefined;
  });

  it('#writeCache and #clearCache operate as expected', () => {
    form.details = { foo : 'bar' };
    form.store.data.push({ a : 1 });
    form.writeCache();
    expect(form.cache.details).to.eql(form.details);
    expect(form.cache.items).to.eql(form.store.data);

    form.clearCache();
    expect(form.cache.details).to.be.undefined;
    expect(form.cache.items).to.be.undefined;
  });

  it('#description sets details.description using $translate', () => {
    chai.spy.on($translate, 'instant', () => 'translated string');

    form.description('KEY');
    expect(form.details.description).to.equal('translated string');
  });
});
