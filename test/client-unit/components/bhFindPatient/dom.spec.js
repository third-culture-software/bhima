/* global inject, expect, chai */

describe.skip('test/client-unit/components/bhFindPatient DOM bindings', DomTests);

/**
 * @todo(@jniles) - finish this test suite. At the moment, it is incomplete and
 * buggy.  Karma seems to have trouble triggering the ng-click event on the
 * dropdown menu items (although the dropdown successfully opens, if you believe
 * the aria label toggle).
 *
 * Eventually, this should compliment the test suite for the component's controller.
 */
function DomTests() {
  const template = `
    <bh-find-patient
      on-search-complete="onSearchComplete(patient)"
      on-register-api="onRegisterApi(api)"
    >
    </bh-find-patient>
  `;

  // test patient to search for
  const patient = {
    uuid : '234c51ae-efcc-4238-98c6-f402bfb39866',
    reference : 'TPA1',
    dob : '1990-03-31T23:00:00.000Z',
    first_name : 'Gorgia',
    middle_name : 'Faith',
    last_name : 'Miller',
    registration_date : '2015-11-26T22:23:003Z',
    sex : 'F',
  };

  const FIND_BY_ID = 'FORM.LABELS.PATIENT_ID';
  const FIND_BY_NAME = 'FORM.LABELS.PATIENT_NAME';

  let $scope; let $compile; let $httpBackend;
  let element; let controller; let
    bindings;

  beforeEach(module(
    'pascalprecht.translate',
    'ngStorage',
    'angularMoment',
    'ui.bootstrap',
    'bhima.services',
    'bhima.components',
    'templates',
    'webcam'));

  // component setup
  beforeEach(inject((_$rootScope_, _$compile_, _$httpBackend_, _$componentController_) => {

    // setup initial imports
    $scope = _$rootScope_.$new();
    $compile = _$compile_;
    $httpBackend = _$httpBackend_;

    // bindings refreshed every time
    bindings = {
      onSearchComplete : chai.spy(),
      onRegisterApi : chai.spy(),
    };

    // compile the element and grab it's controller
    element = $compile(angular.element(template))($scope);
    controller = _$componentController_('bhFindPatient', {
      $scope,
    }, bindings);

    // trigger a digest
    $scope.$digest();
  }));

  // make sure $httpBackend is clean after each test completes
  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  // click an item in the dropdown menu
  function clickDropdownMenuOption(e, option) {
    const toggle = $(e).find('[uib-dropdown-toggle]').eq(0);
    toggle.click();

    $scope.$apply();

    const opt = $(e).find(`[data-find-patient-option="${option}"]`).eq(0);
    opt.click();
    $scope.$digest();
  }

  it('calls the onRegisterApi() callback on component initialisation', () => {
    expect(bindings.onRegisterApi).to.have.been.called();
    expect(bindings.onSearchComplete).to.not.have.been.called();
  });

  it('defaults to finding by id', () => {
    expect(controller.selected.label).to.equal(FIND_BY_ID);
  });

  it('$ctrl.findBy(key) sets the selected property', () => {
    controller.findBy('findByName');
    $scope.$apply();
    expect(controller.selected.label).to.equal(FIND_BY_NAME);

    controller.findBy('findById');
    $scope.$apply();
    expect(controller.selected.label).to.equal(FIND_BY_ID);
  });

  it.skip('switches between "find by id" and "find by name" states', () => {

    $scope.$digest();

    // FIND BY ID OPTION SELECTION
    clickDropdownMenuOption(element, FIND_BY_ID);
    expect(controller.selected.label).to.equal(FIND_BY_ID);

    // FIND BY NAME OPTION SELECTION
    clickDropdownMenuOption(element, FIND_BY_NAME);
    expect(controller.selected.label).to.equal(FIND_BY_NAME);
  });

  it.skip('finds a patient by name', () => {

    // fake array of patient responses
    const response = [patient];

    $httpBackend.expect('GET', '/patients/search?limit=10&reference=TPA1')
      .respond(response);
  });

  it('allows the reset method to reset the component');

  it('suppressReset does not allow the reset method to fire');

  it('exposes an API to allow for resets');

  it('performs form validation on HTTP errors');
}
