/* eslint no-unused-expressions:"off" */
/* global inject,  chai */

describe.skip('test/client-unit/components/bhFindPatient Controller Tests', ControllerTests);

/**
 * @todo - finish the DOM tests to compliment this controller test suite.
 */
function ControllerTests() {
  // test patient to search for
  const patient = {
    uuid              : '234c51ae-efcc-4238-98c6-f402bfb39866',
    reference         : 'TPA1',
    dob               : '1990-03-31T23:00:00.000Z',
    first_name        : 'Gorgia',
    middle_name       : 'Faith',
    last_name         : 'Miller',
    registration_date : '2015-11-26T22:23:003Z',
    sex               : 'F',
  };

  let $scope;
  let $httpBackend;
  let $controller;
  let $componentController;
  let bindings;

  beforeEach(module(
    'pascalprecht.translate', 'ngStorage', 'angularMoment', 'ui.bootstrap',
    'bhima.services', 'bhima.components', 'templates', 'bhima'
  ));

  // component setup
  beforeEach(inject((_$rootScope_, _$httpBackend_, _$componentController_) => {
    // setup initial imports
    $scope = _$rootScope_.$new();

    $httpBackend = _$httpBackend_;
    $componentController = _$componentController_;

    // bindings refreshed every time
    bindings = {
      onSearchComplete : chai.spy(),
      onRegisterApi    : chai.spy(),
    };

    // create the controller
    $controller = $componentController('bhFindPatient', { $scope }, bindings);

    // trigger a digest
    $scope.$digest();

    // allow karma to proxy requests
    $httpBackend.whenGET(/^\/i18n\//).passThrough();

    $controller.$onInit();
  }));

  // make sure $httpBackend is clean after each test completes
  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('#submit() searches by id when an id is set', () => {
    // fake array of patient responses
    const response = [patient];
    const id = 'TPA1';

    $httpBackend.expect('GET', `/patients/?detailed=1&limit=1&reference=${id}`)
      .respond(200, response);

    $controller.selected = $controller.options.findById;
    $controller.idInput = id;
    $controller.submit();
    $scope.$digest();

    // flush the requests
    $httpBackend.flush();
  });

  // @TODO This test tests against old functionality and should be removed or replaced
  it.skip('#submit() selects a patient when searching by name', () => {
    const model = angular.copy(patient);

    $controller.selected = $controller.options.findByName;

    // the name input's model is really the patient
    $controller.nameInput = model;
    $controller.submit();

    expect($controller.patient).to.deep.equal(model);
    expect($controller.patient.display_name).to.be.defined;
  });

  it.skip('#searchByName() toggles the loading state', () => {
    const response = [patient];
    const name = 'junior';

    $httpBackend.expect('GET', `/patients/search/name?display_name=${name}`)
      .respond(200, response);

    expect($controller.loadStatus).to.equal(null);
    $controller.searchByName(name);
    expect($controller.loadStatus).to.equal('loading');

    $httpBackend.flush();
  });

  it('#selectPatient() calls the #onSearchComplete() callback', () => {
    const copy = angular.copy(patient);
    $controller.selectPatient(copy);
    expect(bindings.onSearchComplete).to.have.been.called();
  });

  it('#reset() resets the controller state', () => {

    // set temporary properties
    $controller.showSearchView = false;
    $controller.loadStatus = 'loading';
    $controller.idInput = 'TPA1';
    $controller.nameInput = 'Some Name';

    $controller.reset();

    expect($controller.showSearchView).to.equal(true);
    expect($controller.loadStatus).to.be.null;
    expect($controller.idInput).to.be.undefined;
    expect($controller.nameInput).to.be.undefined;
  });

  it('#onKeyPress submits the controller when the ENTER key is pressed', () => {
    const ENTER_KEY = 13;
    $controller.submit = chai.spy();

    // all these are not the ENTER key
    $controller.onKeyPress({ keyCode : 12 });
    $controller.onKeyPress({ keyCode : 101 });
    $controller.onKeyPress({ keyCode : 0 });

    expect($controller.submit).to.have.not.been.called();

    // when the ENTER key is pressed, submit should be called
    $controller.onKeyPress({ keyCode : ENTER_KEY, preventDefault : angular.noop });
    expect($controller.submit).to.have.been.called();
  });

  it('#onRegisterApi() callback is called on component initialisation', () => {
    expect(bindings.onRegisterApi).to.have.been.called();
    expect(bindings.onSearchComplete).to.not.have.been.called();
  });

  it('#onRegisterApi() exposes an API object', () => {
    let controllerApi;

    bindings = {
      onRegisterApi : (api) => { controllerApi = api; },
    };

    $controller = $componentController('bhFindPatient', { $scope }, bindings);

    $controller.$onInit();

    expect(controllerApi).to.be.an('object');
    expect(controllerApi).to.have.property('api');
  });
}
