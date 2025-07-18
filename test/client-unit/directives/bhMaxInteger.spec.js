/* global inject, expect */
describe('test/client-unit/directives/bhMaxInteger directive', () => {
  let $scope;
  let form;
  let MAX_INTEGER;

  beforeEach(module('bhima.directives', 'bhima.constants'));

  beforeEach(inject(($compile, $rootScope, bhConstants) => {
    $scope = $rootScope;
    MAX_INTEGER = bhConstants.precision.MAX_INTEGER;

    const element = angular.element(`
      <form name="form">
        <input ng-model="models.intValue" name="intValue" bh-max-integer />
      </form>
    `);

    $scope.models = { intValue : null };

    $compile(element)($scope);

    form = $scope.form;
  }));

  it('allows small positive integer values', () => {
    const correctIntegerValue = 10;

    form.intValue.$setViewValue(correctIntegerValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(correctIntegerValue);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('allows zero', () => {
    form.intValue.$setViewValue(0);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(0);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('allows negative values', () => {
    const negativeValue = -1000;

    form.intValue.$setViewValue(negativeValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(negativeValue);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('allows the MAX_INTEGER value', () => {
    form.intValue.$setViewValue(MAX_INTEGER);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(MAX_INTEGER);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('allows values just below MAX_INTEGER', () => {
    const belowMaxValue = MAX_INTEGER - 1;

    form.intValue.$setViewValue(belowMaxValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(belowMaxValue);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('blocks values that are larger than the MAX_INTEGER value', () => {
    form.intValue.$setViewValue(MAX_INTEGER + 1);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('blocks values significantly larger than MAX_INTEGER', () => {
    const largeValue = MAX_INTEGER * 2;

    form.intValue.$setViewValue(largeValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('allows string representations of valid numbers', () => {
    const stringValue = '1000';

    form.intValue.$setViewValue(stringValue);
    $scope.$digest();

    expect(form.intValue.$valid).to.equal(true);
  });

  it('allows string representations of MAX_INTEGER', () => {
    const stringMaxValue = MAX_INTEGER.toString();

    form.intValue.$setViewValue(stringMaxValue);
    $scope.$digest();

    expect(form.intValue.$valid).to.equal(true);
  });

  it('blocks string representations of values over MAX_INTEGER', () => {
    const stringOverMaxValue = (MAX_INTEGER + 1).toString();

    form.intValue.$setViewValue(stringOverMaxValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('allows decimal values within range', () => {
    const decimalValue = 1000.5;

    form.intValue.$setViewValue(decimalValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(decimalValue);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('blocks decimal values over MAX_INTEGER', () => {
    const decimalOverMaxValue = MAX_INTEGER + 0.1;

    form.intValue.$setViewValue(decimalOverMaxValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('handles non-numeric strings as invalid (NaN case)', () => {
    const nonNumericString = 'not a number';

    form.intValue.$setViewValue(nonNumericString);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('handles empty strings as valid (converts to 0)', () => {
    const emptyString = '';

    form.intValue.$setViewValue(emptyString);
    $scope.$digest();

    expect(form.intValue.$valid).to.equal(true);
  });

  it('handles null values as valid (converts to 0)', () => {
    form.intValue.$setViewValue(null);
    $scope.$digest();

    expect(form.intValue.$valid).to.equal(true);
  });

  it('handles scientific notation within range', () => {
    const scientificValue = '1e3'; // 1000

    form.intValue.$setViewValue(scientificValue);
    $scope.$digest();

    expect(form.intValue.$valid).to.equal(true);
  });

  it('blocks scientific notation over MAX_INTEGER', () => {
    const largeSciValue = '1e10'; // 10,000,000,000

    form.intValue.$setViewValue(largeSciValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });
});
