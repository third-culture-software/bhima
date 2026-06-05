/* eslint no-unused-expressions:off */
/* global inject, chai */

describe('test/client-unit/components/bhFindInvoice', () => {

  const patient = {
    uuid              : '234c51ae-efcc-4238-98c6-f402bfb39866',
    reference         : 'TPA17',
    dob               : '1993-04-25T23:00:00.000Z',
    first_name        : 'Brandon',
    middle_name       : 'Hope',
    last_name         : 'Spike',
    registration_date : '2018-05-10T23:00:000Z',
    sex               : 'F',
    invoice_reference : 'IV.TPA.001',
  };

  const invoice = {
    uuid : 'abcc51ae-efcc-4238-98c6-f402bfb39866',
    reference : 'IV.TPA.001',
    patient_uuid : '234c51ae-efcc-4238-98c6-f402bfb39866',
  };

  const template = `
    <bh-find-invoice
      patient-uuid="patientUuid"
      on-search-complete="callback(record)">
    </bh-find-invoice>
  `;

  // make sure the modules are correctly loaded.
  beforeEach(module(
    'pascalprecht.translate',
    'ngStorage',
    'ui.bootstrap',
    'angularMoment',
    'tmh.dynamicLocale',
    'bhima.services',
    'bhima.components',
    'bhima.constants',
    'templates',
    'ui.router',
  ));

  let $scope;
  let $compile;
  let $controller;
  let element;
  let Q;
  let PatientInvoice;
  let Notify;

  // find element function without jquery dependencies
  const find = (elm, selector) => elm[0].querySelector(selector);

  // inject dependencies
  beforeEach(inject((_$rootScope_, _$compile_, _$q_, _PatientInvoiceService_, _$window_, _NotifyService_) => {
    $compile = _$compile_;
    $scope = _$rootScope_.$new();
    PatientInvoice = _PatientInvoiceService_;
    Notify = _NotifyService_;
    Q = _$q_;

    element = angular.element(template);
    element = $compile(element)($scope);

    // overwrite the getElementById function
    _$window_.document.getElementById = (id) => find(element, `#${id}`);

    // track notification of error
    Notify.handleError = chai.spy();

    $scope.patientUuid = '234c51ae-efcc-4238-98c6-f402bfb39866';
    $scope.callback = chai.spy();
    $scope.$digest();
  }));

  it('#bhFindInvoice component exists and it is compiled', () => {
    const input = find(element, '#search-input');
    expect(angular.element(input).length).to.equal(1);

    const button = find(element, '#search-button');
    expect(angular.element(button).length).to.equal(1);
  });

  it('Runs the search method when the ENTER key is pressed', () => {
    const ENTER_KEY = 13;
    const FormController = $scope.$$childTail.FindInvoiceForm;

    // the component controller
    $controller = $scope.$$childTail.$ctrl;
    $controller.search = chai.spy();

    // insert the invoice reference into the input box
    setInput(patient.invoice_reference);

    // all these are not the ENTER key
    $controller.onKeyPress({ keyCode : 64 }, FormController);
    $controller.onKeyPress({ keyCode : 0 }, FormController);
    expect($controller.search).to.have.not.been.called();

    // when the ENTER key is pressed, submit should be called
    $controller.onKeyPress({ keyCode : ENTER_KEY, preventDefault : angular.noop }, FormController);
    expect($controller.search).to.have.been.called();
  });

  it('Runs the search method when click on the search button', () => {
    // the component controller
    $controller = $scope.$$childTail.$ctrl;
    $controller.search = chai.spy();

    // insert the invoice reference into the input box
    setInput(patient.invoice_reference);
    expect($controller.search).to.have.not.been.called();

    // click on search button
    clickOnSearch();
    expect($controller.search).to.have.been.called();
  });

  it('Calls onSearchComplete() when the invoice is found', () => {
    // mock a success response
    const record = angular.copy(invoice);

    // rewrite findConsumableInvoicePatient with mock invoice
    PatientInvoice.findConsumableInvoicePatient = () => {
      return Q.resolve({ details : record, items : [] });
    };

    // input the invoice reference
    setInput(patient.invoice_reference);

    // click on search button
    clickOnSearch();

    // evaluate
    expect($scope.callback).to.have.been.called();
  });

  it('Shows a success message when the invoice is found', () => {
    // mock a success response
    const record = angular.copy(invoice);

    // rewrite findConsumableInvoicePatient with mock invoice
    PatientInvoice.findConsumableInvoicePatient = () => {
      return Q.resolve({ details : record, items : [] });
    };

    // input the invoice reference
    setInput(patient.invoice_reference);

    // click on search button
    clickOnSearch();

    // find the success alert element
    const message = find(element, '.alert-success');
    expect(angular.element(message).length).to.equal(1);

    // the error handler is not called
    expect(Notify.handleError).to.have.not.been.called();
  });

  it('Should not show a success message when the invoice is not found', () => {
    // rewrite findConsumableInvoicePatient with mock invoice
    PatientInvoice.findConsumableInvoicePatient = () => {
      return Q.reject({ status : 404 });
    };

    // input the invoice reference
    setInput('');

    // click on search button
    clickOnSearch();

    // cannot find the success alert message
    const message = find(element, '.alert-success');
    expect(angular.element(message).length).to.equal(0);
  });

  it('Calls the Notify.handleError on 404 error when the invoice is not found', () => {
    // rewrite findConsumableInvoicePatient with mock invoice
    PatientInvoice.findConsumableInvoicePatient = () => {
      return Q.reject({ status : 404 });
    };

    // input the invoice reference
    setInput('');

    // click on search button
    clickOnSearch();

    // the error handler is called
    expect(Notify.handleError).to.have.been.called();
  });

  /**
   *
   * @param value
   */
  function setInput(value) {
    const input = find(element, '#search-input');
    const ngModel = angular.element(input).controller('ngModel');
    ngModel.$setViewValue(value);
    $scope.$digest();
  }

  /**
   *
   */
  function clickOnSearch() {
    const btn = find(element, '#search-button');
    btn.click();
    $scope.$digest();
  }

});
