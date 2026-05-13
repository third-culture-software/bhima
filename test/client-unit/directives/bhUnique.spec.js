/* global inject, */
describe('test/client-unit/directives/bhUnique directive', () => {
  let $scope;
  let form;

  let MockUniqueValidatorService;
  let $flushPendingTasks;

  // these represent values that the external $http request would return as
  // already registered in the database
  const existingValues = [100, 110, 120];

  beforeEach(module('bhima.directives', 'bhima.services'));

  beforeEach(module(($provide) => {

    // if this service is used by multiple directives/ controllers the mock
    // can be defined in an external /shared folder
    MockUniqueValidatorService = function ($q) {
      return {
        check(validationUrl, viewValue) {
          return existingValues.indexOf(viewValue) > -1 ? $q.reject() : $q.resolve();
        },
      };
    };

    // override the default unique validator service with a mocked service.
    $provide.service('UniqueValidatorService', MockUniqueValidatorService);
  }));

  beforeEach(inject(($compile, $rootScope, _$flushPendingTasks_) => {
    $scope = $rootScope;

    const element = angular.element(`
      <form name="form">
        <input ng-model="models.uniqueValue" name="uniqueValue" bh-unique="/validation_path">
      </form>
    `);

    $scope.models = {
      uniqueValue : null,
    };

    $compile(element)($scope);
    form = $scope.form;
    $flushPendingTasks = _$flushPendingTasks_;
  }));

  it('rejects a value that already exists', () => {

    // take the first exisitng value
    const existingValue = existingValues[0];

    form.uniqueValue.$setViewValue(existingValue);
    $scope.$digest();
    $flushPendingTasks();

    expect($scope.models.uniqueValue).to.equal(undefined);
    expect(form.uniqueValue.$valid).to.equal(false);
  });

  it('accepts a value that is unique', () => {
    const uniqueValue = 200;

    form.uniqueValue.$setViewValue(uniqueValue);
    $scope.$digest();
    $flushPendingTasks();

    expect($scope.models.uniqueValue).to.equal(uniqueValue);
    expect(form.uniqueValue.$valid).to.equal(true);
  });
});
