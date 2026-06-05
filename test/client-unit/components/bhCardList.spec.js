/* eslint no-unused-expressions:off */
/* global inject */
describe('test/client-unit/components/bhCardList', () => {

  let $compile;
  let $rootScope;
  let $templateCache;

  // default test dataset
  const DEFAULT_DATASET = [
    { id : 1, title : 'A: Test Card', text : 'Awake, Oh Sleeper' },
    { id : 2, title : 'B: Test Card', text : 'Rise from the dead' },
    { id : 3, title : 'C: Test Card', text : 'And Christ will shine on you.' },
  ];

  const bhCardListTemplate = `
    <bh-card-list
      data="data"
      OTHER_OPTIONS
      template="card-template.html">
    </bh-card-list>
  `;

  const bhCardTemplate = `
    <div data-test-card>
      <h1 data-test-card-title>{{card.title}}</h1>
      <p data-test-card-text>{{card.text}}</p>
    </div>
  `;

  // helper functions for finding elements in the DOM.
  const find = (elm, selector) => elm[0].querySelector(selector);
  const findAll = (elm, selector) => elm[0].querySelectorAll(selector);

  beforeEach(module('bhima.components', 'templates'));

  beforeEach(inject((_$compile_, _$rootScope_, _$templateCache_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $templateCache = _$templateCache_;

    $templateCache.put('card-template.html', bhCardTemplate);
  }));

  // helper function to set up a template
  /**
   *
   * @param $scope
   * @param options
   */
  function setupTemplate($scope, options = '') {
    const template = angular.element(bhCardListTemplate.replace('OTHER_OPTONS', options));
    const element = $compile(template)($scope);
    $scope.$digest();
    return element;
  }

  it('will load a template from the template cache with minimal options', () => {
    const $scope = $rootScope.$new();
    const message = 'I am a stranger here.';
    $scope.data = [{ id : 1, text : message }];

    const element = setupTemplate($scope);

    const card = find(element, '[data-test-card]');
    expect(card).to.exist;
    expect(card).to.contain.text(message);
  });

  it('will load multiple cards for each data element', () => {
    const $scope = $rootScope.$new();
    $scope.data = angular.copy(DEFAULT_DATASET);
    const element = setupTemplate($scope);

    const cards = findAll(element, '[data-test-card]');
    expect(cards).to.have.length(3);
  });

  it('will listen for changes in the data and load new cards', () => {
    const $scope = $rootScope.$new();
    $scope.data = angular.copy(DEFAULT_DATASET);
    const element = setupTemplate($scope);

    let cards = findAll(element, '[data-test-card]');
    expect(cards).to.have.length(3);

    // remove all but the first one data element
    $scope.data.splice(1);

    $scope.$digest();

    cards = findAll(element, '[data-test-card]');
    expect(cards).to.have.length(1);
  });

  it('filter element should not be visible by default', () => {
    const $scope = $rootScope.$new();
    $scope.data = angular.copy(DEFAULT_DATASET);
    const element = setupTemplate($scope);

    const filterInput = find(element, '[data-filter-input]');
    expect(filterInput).to.have.class('ng-hide');
  });

  it('#toggleFilter() should change the visibility of the filter input', () => {
    const $scope = $rootScope.$new();
    $scope.data = angular.copy(DEFAULT_DATASET);
    const element = setupTemplate($scope);

    const toggle = find(element, '[data-toggle-filter]');
    angular.element(toggle).click();
    $scope.$digest();

    let filterInput = find(element, '[data-filter-input]');
    expect(filterInput).not.to.have.class('ng-hide');

    angular.element(toggle).click();
    $scope.$digest();

    filterInput = find(element, '[data-filter-input]');
    expect(filterInput).to.have.class('ng-hide');
  });

  it('should support filtering the values in the DOM', () => {
    const $scope = $rootScope.$new();
    $scope.data = angular.copy(DEFAULT_DATASET);
    const element = setupTemplate($scope, ' sort-name="title" ');

    const toggle = find(element, '[data-toggle-filter]');
    angular.element(toggle).click();
    $scope.$digest();

    let cards = findAll(element, '[data-test-card]');
    expect(cards).to.have.length(3);

    const filterInput = find(element, '[data-filter-input]');
    angular.element(filterInput).val('B:').trigger('input');
    $scope.$apply();

    cards = findAll(element, '[data-test-card]');

    expect(cards).to.have.length(1);
  });

  it('#setOrder() should change the order of card elements in the DOM', () => {
    const $scope = $rootScope.$new();
    $scope.data = angular.copy(DEFAULT_DATASET);
    const element = setupTemplate($scope, ' sort-name="title" ');

    let cards = findAll(element, '[data-test-card]');
    expect(cards).to.have.length(3);

    const descKey = 'TABLE.COLUMNS.SORTING.NAME_DESC';
    const ascKey = 'TABLE.COLUMNS.SORTING.NAME_ASC';

    // TEST - sort descending order

    const sortDescendingToggle = find(element, `[data-key="${descKey}"]`);
    angular.element(sortDescendingToggle).click();
    $scope.$digest();

    cards = findAll(element, '[data-test-card]');
    let firstCard = angular.element(cards[0]);
    let firstCardTitle = find(firstCard, '[data-test-card-title]');
    expect(firstCardTitle).to.contain.text('C: Test Card');

    // TEST - sort ascending order

    const sortAscendingToggle = find(element, `[data-key="${ascKey}"]`);
    angular.element(sortAscendingToggle).click();
    $scope.$digest();

    cards = findAll(element, '[data-test-card]');
    firstCard = angular.element(cards[0]);

    firstCardTitle = find(firstCard, '[data-test-card-title]');
    expect(firstCardTitle).to.contain.text('A: Test Card');
  });

});
