/* eslint no-unused-expressions:off */
/* global inject, chai */

describe('test/client-unit/components/bhCheckboxTree', () => {

  beforeEach(module(
    'pascalprecht.translate',
    'bhima.services',
    'bhima.components',
    'templates',
  ));

  let $rootScope;
  let $compile;

  // find element function without jquery dependencies
  const find = (elm, selector) => elm[0].querySelector(selector);
  const findAll = (elm, selector) => elm[0].querySelectorAll(selector);

  const tree = [{
    id : 1,
    name : 'Ben',
  }, {
    id : 2,
    name : 'Amy',
  }, {
    id : 3,
    name : 'George',
  }];

  // inject dependencies
  beforeEach(inject((_$rootScope_, _$compile_) => {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  // make
  /**
   *
   * @param data
   * @param onChange
   * @param {...any} args
   */
  function makeComponent(data, onChange, ...args) {
    const template = `
      <bh-checkbox-tree
        data=data
        on-change=callback(data)
        ${args.join(' ')}
        >
      </bh-checkbox-tree>
    `;

    const $scope = $rootScope.$new();
    $scope.data = data;
    $scope.callback = chai.spy(onChange);
    const element = $compile(angular.element(template))($scope);
    $scope.$digest();
    return { element, $scope };
  }

  it('renders a checkbox tree of size four', () => {
    const { element } = makeComponent(tree, angular.noop, 'is-flat-tree="true"', 'label-key="name"');
    const checkboxes = findAll(element, '.checkbox');
    expect(checkboxes).to.have.length(4);
  });

  it('renders a tree with three levels of depth', () => {
    const data = [
      { id : 1, label : '1st Level', parent : 0 },
      { id : 2, label : '2nd Level', parent : 1 },
      { id : 3, label : '3rd Level', parent : 2 },
    ];

    const { element } = makeComponent(data, angular.noop);
    const checkboxes = findAll(element, '.checkbox');
    expect(checkboxes).to.have.length(4);

    const lowestLevel = find(element, 'ul ul li label');
    expect(lowestLevel).to.have.attribute('data-label', '3rd Level');
  });

  it('renders a flat list as a tree with the is-flat-tree flag set', () => {
    const { element } = makeComponent(tree, angular.noop, 'is-flat-true="true"', 'label-key="name"');
    const checkboxes = findAll(element, '.checkbox');
    expect(checkboxes).to.have.length(4);

    const oneLevel = find(element, 'ul ul');
    expect(oneLevel).to.equal(null);
  });

  it.skip('calls the onChange callback when a checkbox is clicked', () => {
    const callback = () => { /* console.log('clicked!'); */ };
    const { element, $scope } = makeComponent(tree, callback, 'is-flat-true="true"', 'label-key="name"');

    // simulate a click on one of the checkboxes
    const node = find(element, '[data-label="Amy"] input');

    angular.element(node).triggerHandler('click');
    $scope.$digest();

    expect($scope.callback).to.have.been.called();
  });

});
