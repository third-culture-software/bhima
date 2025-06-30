/* global inject, expect */
describe('test/client-unit/directives/bhMaxInteger directive', () => {
  let $scope;
  let form;

  const MAX_INT = 16777215;

  beforeEach(module('bhima.directives', 'bhima.constants'));

  // $complile and $rootScope are injected using angular name based dependency
  // injection
  beforeEach(inject(($compile, $rootScope) => {
    $scope = $rootScope;

    const element = angular.element(`
      <form name="form">
        <input ng-model="models.intValue" name="intValue" bh-max-integer />
      </form>
    `);

    // initialise models that will be used
    $scope.models = {
      intValue : null,
    };

    // compile angular element in with the context of $rootScope
    $compile(element)($scope);

    // eslint-disable-next-line prefer-destructuring
    form = $scope.form;
  }));

  it('allows an integer value', () => {
    const correctIntegerValue = 10;

    form.intValue.$setViewValue(correctIntegerValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(correctIntegerValue);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('allows the MAX_INT value', () => {
    form.intValue.$setViewValue(MAX_INT);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(MAX_INT);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('blocks values that are larger than the MAX_INT value', () => {
    form.intValue.$setViewValue(MAX_INT + 1);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });
});
