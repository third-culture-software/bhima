/* global inject, expect, chai */
/* eslint no-unused-expressions:off */
describe('test/client-unit/services/PatientInvoiceForm', () => {
  let PatientInvoiceForm;
  let httpBackend;
  let Session;
  let form;
  let Mocks;
  let $document;
  let $timeout;

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
    _PatientInvoiceForm_,
    $httpBackend, _SessionService_,
    _MockDataService_, _$document_,
    _$timeout_,
  ) => {
    PatientInvoiceForm = _PatientInvoiceForm_;
    Session = _SessionService_;
    Mocks = _MockDataService_;
    $document = _$document_;
    $timeout = _$timeout_;

    // set up the required properties for the session
    Session.create(Mocks.user(), Mocks.enterprise(), Mocks.stock_settings(), Mocks.project());

    httpBackend = $httpBackend;

    const patient = Mocks.patient();
    const baseUrl = `/patients/${patient.uuid}`;

    // configure endpoints for HTTP requests
    httpBackend.when('GET', baseUrl)
      .respond(200, patient);

    httpBackend.when('GET', `${baseUrl}/services`)
      .respond(200, Mocks.invoicingFees());

    httpBackend.when('GET', `${baseUrl}/subsidies`)
      .respond(200, Mocks.subsidies());

    httpBackend.when('GET', `${baseUrl}/finance/balance`)
      .respond(200, null);

    httpBackend.when('GET', `/prices/${patient.price_list_uuid}`)
      .respond(200, Mocks.priceList());

    httpBackend.when('GET', '/services/')
      .respond(200, Mocks.services());

    httpBackend.when('GET', '/inventory/metadata/?detailed=1&locked=0&skipTags=true')
      .respond(200, Mocks.inventories());

    httpBackend.when('GET', '/debtor_groups/4de0fe47-177f-4d30-b95f-cff8166400b4')
      .respond(200, { max_debt : 7000 });

    httpBackend.when('GET', '/accounts/1350/balance?journal=1')
      .respond(200, { balance : 3000 });

    form = new PatientInvoiceForm('InvoiceTestKey');
    httpBackend.flush();
  }));

  // make sure $http is clean after tests
  afterEach(() => {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  context('#constructor()', () => {
    let constructorForm;
    let setupSpy;
    let inventorySpy;

    before(() => {
      constructorForm = new PatientInvoiceForm('TestCacheKey');
      setupSpy = chai.spy.on(constructorForm, 'setup');
      inventorySpy = chai.spy.on(constructorForm.inventory, 'initialize');
    });

    it('#constructor() calls #setup() on initialization', () => {
      expect(setupSpy).to.have.been.called;
    });

    it('#constructor() creates a new, empty store for the grid', () => {
      expect(constructorForm.store).to.exist;
      expect(constructorForm.store.identifier).to.equal('uuid');
      expect(constructorForm.store.data).to.have.length(0);
    });

    it('#constructor() initializes the inventory', () => {
      expect(inventorySpy).to.have.been.called;
    });

    it('#constructor() sets the form to be invalid by default', () => {
      expect(constructorForm._invalid).to.equal(true);
      expect(constructorForm._valid).to.equal(false);
    });
  });

  it('#constructor() creates an inventory pool with six items in it', () => {
    expect(form.inventory).to.exist;
    expect(form.inventory.size()).to.equal(6);
  });

  it('#constructor() sets the default service on startup', () => {
    const [service] = Mocks.services();
    expect(form.details.service_uuid).to.equal(service.uuid);
  });

  it('#setPatient() sets the patient and downloads relevant data', () => {
    const patient = Mocks.patient();
    form.setPatient(patient);
    expect(form.details.debtor_uuid).to.equal(patient.debtor_uuid);

    // make sure promise methods fire
    httpBackend.flush();

    const priceList = Mocks.priceList();
    const mockInvoiceFeeIds = Mocks.invoicingFees().map(fee => fee.id);
    const mockSubsidyIds = Mocks.subsidies().map(subsidy => subsidy.id);

    expect(form.prices.data).to.have.deep.members(priceList.items);

    // test that all ids of invoice fees are in the form.
    const invoiceFeeIds = form.invoicingFees.map(fee => fee.id);
    const subsidyIds = form.subsidies.map(subsidy => subsidy.id);

    expect(invoiceFeeIds).to.have.members(mockInvoiceFeeIds);
    expect(subsidyIds).to.have.members(mockSubsidyIds);
  });

  it('#addItem() adds a row to the store', () => {
    expect(form.store.data).to.have.length(0);
    form.addItem();
    expect(form.store.data).to.have.length(1);
  });

  it('#removeItem() removes a specific uuid from the store', () => {
    form.addItem();
    expect(form.store.data).to.have.length(1);
    const [item] = form.store.data;
    form.removeItem(item);

    expect(form.store.data).to.have.length(0);
    expect(form.store.get(item.uuid)).to.be.undefined;
  });

  it('#clear() removes all data from the internal store', () => {
    form.addItem();
    form.addItem();
    form.addItem();
    form.addItem();
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

  it('#digest() calculates totals', () => {
    form.digest();

    const mockTotals = {
      invoicingFees : 0,
      rows : 0,
      subsidies : 0,
      grandTotal : 0,
    };

    expect(form.totals).to.eql(mockTotals);

    // put two items in the store
    form.addItem();
    form.addItem();

    // alias the items
    const [itemA, itemB] = form.store.data;

    // configure the items with inventory items
    const mefloquine = {
      uuid : 'd2f7ef71-6f3e-44bd-8056-378c5ca26e20',
      price : 0.9600,
      text : 'Mefloquine 250mg',
      code : '100070',
      sales_account : true,
      default_quantity : 10,
    };

    const quinine = {
      uuid : '43f3decb-fce9-426e-940a-bc2150e62186',
      code : '100102',
      text : 'Quinine sulphate 500mg',
      price : 0.1500,
      sales_account : true,
      default_quantity : 30,
    };

    itemA.configure(mefloquine);
    itemB.configure(quinine);

    form.digest();

    // this is 30 * 0.15 + 10 * .96
    mockTotals.rows = 14.1;
    mockTotals.grandTotal += mockTotals.rows;

    const str = (j) => JSON.stringify(j);

    expect(form.totals, `${str(form.totals)} should equal ${str(mockTotals)}`).to.eql(mockTotals);
  });

  it('#configureItem() calls $document[0].getElementById()', () => {
    form.addItem();

    const [item] = form.store.data;

    const mefloquine = {
      uuid : 'd2f7ef71-6f3e-44bd-8056-378c5ca26e20',
      inventory_uuid : 'd2f7ef71-6f3e-44bd-8056-378c5ca26e20',
    };

    angular.merge(item, mefloquine);

    // mocks a DOM element for the focus() call
    const mockDOMElement = {
      focus : () => {},
    };

    // replace the top level document with a simple chai spy.
    // NOTE(@jniles) - this is slightly hacky since:
    //  1. I don't know if anything else in the script depends on $document[0]
    //  2. $document[0] seems too abstract.
    // However, this is the AngularJS's official recommendation for mocking
    // calls to $document.
    const spy = chai.spy(() => mockDOMElement);
    $document[0].getElementById = spy;

    form.configureItem(item);

    $timeout.flush();

    expect(spy).to.have.been.called.with(item.uuid);
  });

  it('#setEnterprise() should set the enterprise on the form', () => {
    const enterprise = Mocks.enterprise();
    form.setEnterprise(enterprise);
    expect(form.enterprise).to.deep.equal(enterprise);
  });

  it('#setPatient() blocks the patient account on maximum debt exceeded', () => {
    httpBackend.when('GET', '/debtor_groups/4de0fe47-177f-4d30-b95f-cff8166400b4')
      .respond(200, { max_debt : 1000 });

    // change the order of HTTP backend checks so that the above .when() condition is matched first.
    httpBackend.matchLatestDefinitionEnabled(true);

    // create a new form, set the patient, and flush requests to make sure everything is settled
    form = new PatientInvoiceForm('InvoiceTestKey');
    httpBackend.flush();
    $timeout.flush();

    // we need the enterprise currency id to make sure that error message renders in the
    // correct currency.
    form.setEnterprise(Mocks.enterprise());
    const patient = Mocks.patient();
    form.setPatient(patient);

    $timeout.flush();
    httpBackend.flush();

    // the form should have an error
    expect(form._error).to.equal('DEBTOR_GROUP.ERRORS.OVERDRAFT_LIMIT_EXCEEDED');

    // reset the ordering for future tests
    httpBackend.matchLatestDefinitionEnabled(false);
  });
});
