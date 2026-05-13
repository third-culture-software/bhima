/* eslint no-unused-expressions:off, no-continue: off */
/* global inject,  chai */

describe('test/client-unit/directives/bhBlur directive', () => {
  let $compile;
  let $scope;
  let element;

  const ENTER_KEY = 13;
  const TAB_KEY = 9;

  // utility function
  const find = (elm, selector) => elm[0].querySelector(selector);

  const triggerKeyDown = (_element, _keyCode) => {
    const e = angular.element.Event('keydown');
    e.which = _keyCode;
    _element.trigger(e);
  };

  beforeEach(module(
    'bhima.directives',
    'bhima.services'
  ));

  beforeEach(inject((_$compile_, _$rootScope_) => {
    $scope = _$rootScope_.$new();
    $compile = _$compile_;

    element = angular.element(`
      <form name="form">
        <input id="row" name="row" bh-blur="models.callback(1)">
      </form>
    `);

    $scope.models = {
      callback : chai.spy(),
    };

    $compile(element)($scope);
  }));

  it('should call a given method on blur by Enter key', () => {
    const input = find(element, '#row');
    triggerKeyDown(angular.element(input), ENTER_KEY);
    $scope.$digest();
    expect($scope.models.callback).to.have.been.called();
  });

  it('should call a given method on blur by Tab key', () => {
    const input = find(element, '#row');
    triggerKeyDown(angular.element(input), TAB_KEY);
    $scope.$digest();
    expect($scope.models.callback).to.have.been.called();
  });

  it('should not call a given method on blur for other key apart from Tab and Enter', () => {
    const input = find(element, '#row');
    for (let i = 0; i < 128; i++) {
      if (i === ENTER_KEY || i === TAB_KEY) { continue; }

      triggerKeyDown(angular.element(input), i);
      $scope.$digest();
      expect($scope.models.callback).to.not.have.been.called();
    }
  });

  it('should call a given method with a given parameter on blur by Enter key', () => {
    const input = find(element, '#row');
    triggerKeyDown(angular.element(input), ENTER_KEY);
    $scope.$digest();
    expect($scope.models.callback).to.have.been.called.with(1);
  });

});
