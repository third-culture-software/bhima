/* eslint no-unused-expressions:off */
/* global inject,  chai */

describe('test/client-unit/components/bhDateEditor', () => {

  const template = `
    <bh-date-editor date-value="date" on-change="callback(date)">
    </bh-date-editor>
  `;

  // OPTIONS
  const templateWithOptions = `
    <bh-date-editor date-value="date" on-change="callback(date)" OPTIONS>
    </bh-date-editor>
  `;

  // make sure the modules are correctly loaded.
  beforeEach(module(
    'bhima.services',
    'angularMoment',
    'ngStorage',
    'pascalprecht.translate',
    'bhima.components',
    'bhima.constants',
    'templates',
    'bhima.mocks',
    'ui.router',
  ));

  let $scope;
  let $compile;
  let element;
  let Session;
  let Fiscal;
  let Mocks;
  let httpBackend;

  const enterpriseFiscalStartDate = '2015-01-01T00:00:00.000Z';
  const futureDate = '2200-01-20';
  // ??? const invalidOldDate = '2001-01-20';

  // utility fns
  const find = (elm, selector) => elm[0].querySelector(selector);

  beforeEach(inject((_$rootScope_, _$compile_, $httpBackend, _SessionService_, _FiscalService_, _MockDataService_) => {
    Session = _SessionService_;
    Mocks = _MockDataService_;
    Fiscal = _FiscalService_;

    httpBackend = $httpBackend;

    httpBackend.when('GET', `/enterprises/${Mocks.enterprise().id}/fiscal_start`)
      .respond(200, { start_date : enterpriseFiscalStartDate });

    $compile = _$compile_;
    $scope = _$rootScope_.$new();

    Session.create(Mocks.user(), Mocks.enterprise(), Mocks.stock_settings(), Mocks.project());

    // spy on the onChange callback
    $scope.date = new Date();
    $scope.callback = chai.spy();
    element = $compile(angular.element(template))($scope);

    $scope.$digest();
  }));

  it('the "label" binding should set the label', () => {
    const stub = templateWithOptions
      .replace('OPTIONS', 'label="HELLO_WORLD"');

    element = $compile(angular.element(stub))($scope);
    $scope.$digest();

    const label = find(element, '.control-label');
    expect(label).to.have.text('HELLO_WORLD');
  });

  const clickOnCalendarButton = (elm) => {
    const btn = find(elm, '[data-date-editor] button');
    angular.element(btn).triggerHandler('click');
    $scope.$digest();
  };

  it('calendar button enables the input', () => {
    const input = find(element, '[data-date-editor-input]');
    expect(input).to.have.attr('readonly');

    clickOnCalendarButton(element);

    expect(input).not.to.have.attr('readonly');
  });

  it('changing the date value should fire the onChange event', () => {
    const input = find(element, '[data-date-editor-input]');

    // make sure the input is not readonly
    clickOnCalendarButton(element);

    const ngModel = angular.element(input).controller('ngModel');
    ngModel.$setViewValue('2015-02-03');
    $scope.$digest();

    expect($scope.callback).to.have.been.called();
  });

  it('Should not allow future date to be selected', () => {
    const input = find(element, '[data-date-editor-input]');
    clickOnCalendarButton(element);

    const ngModel = angular.element(input).controller('ngModel');
    ngModel.$setViewValue(futureDate);
    $scope.$digest();
    expect(ngModel.$modelValue).to.be.equal(undefined);

  });

  it('Should allow future date to be selected', () => {

    const stub = templateWithOptions
      .replace('OPTIONS', 'allow-future-date="true"');

    element = $compile(angular.element(stub))($scope);
    $scope.$digest();
    const input = find(element, '[data-date-editor-input]');

    clickOnCalendarButton(element);

    const ngModel = angular.element(input).controller('ngModel');
    ngModel.$setUntouched();
    ngModel.$setViewValue(futureDate);
    element = $compile(angular.element(stub))($scope);
    $scope.$digest();
    expect(ngModel.$modelValue).to.be.equal(futureDate);
  });

  describe('limit-min-fiscal flag', () => {
    const fiscalLimitElement = `
      <bh-date-editor date-value="date" limit-min-fiscal></bh-date-editor>
    `;
    let fiscalElement; // eslint-disable-line

    it('limit fiscal year requests start date', () => {
      fiscalElement = $compile(angular.element(fiscalLimitElement))($scope);
      const spy = chai.spy.on(Fiscal, 'getEnterpriseFiscalStartDate');

      $scope.$digest();
      expect(spy).to.have.been.called.exactly(1);
    });
  });

});
