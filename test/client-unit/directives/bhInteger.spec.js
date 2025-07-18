/* global inject, expect */
describe('test/client-unit/directives/bhInteger directive', () => {
  let $scope;
  let form;

  beforeEach(module('bhima.directives'));

  beforeEach(inject(($compile, $rootScope) => {
    $scope = $rootScope;

    const element = angular.element(`
      <form name="form">
        <input ng-model="models.intValue" name="intValue" bh-integer />
      </form>
    `);

    $scope.models = { intValue : null };

    $compile(element)($scope);

    form = $scope.form;
  }));

  it('validates positive integer values', () => {
    const correctIntegerValue = 10;

    form.intValue.$setViewValue(correctIntegerValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(correctIntegerValue);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('validates negative integer values', () => {
    const negativeIntegerValue = -15;

    form.intValue.$setViewValue(negativeIntegerValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(negativeIntegerValue);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('validates zero as an integer', () => {
    const zeroValue = 0;

    form.intValue.$setViewValue(zeroValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(zeroValue);
    expect(form.intValue.$valid).to.equal(true);
  });

  it('validates integer strings', () => {
    const stringIntegerValue = '42';

    form.intValue.$setViewValue(stringIntegerValue);
    $scope.$digest();

    expect(form.intValue.$valid).to.equal(true);
  });

  it('validates negative integer strings', () => {
    const negativeStringIntegerValue = '-42';

    form.intValue.$setViewValue(negativeStringIntegerValue);
    $scope.$digest();

    expect(form.intValue.$valid).to.equal(true);
  });

  it('blocks decimal values', () => {
    const incorrectDecimalValue = 10.23;

    form.intValue.$setViewValue(incorrectDecimalValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('blocks string decimal values', () => {
    const stringDecimalValue = '10.23';

    form.intValue.$setViewValue(stringDecimalValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('blocks non-numeric strings', () => {
    const incorrectStringValue = 'value';

    form.intValue.$setViewValue(incorrectStringValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('blocks empty strings', () => {
    const emptyStringValue = '';

    form.intValue.$setViewValue(emptyStringValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('blocks null values', () => {
    const nullValue = null;

    form.intValue.$setViewValue(nullValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('blocks numbers with leading zeros', () => {
    const leadingZeroValue = '007';

    form.intValue.$setViewValue(leadingZeroValue);
    $scope.$digest();

    expect(form.intValue.$valid).to.equal(true);
  });

  it('blocks mixed alphanumeric values', () => {
    const mixedValue = '123abc';

    form.intValue.$setViewValue(mixedValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('blocks values with scientific notation', () => {
    const scientificValue = '1e10';

    form.intValue.$setViewValue(scientificValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });

  it('blocks values with whitespace', () => {
    const whitespaceValue = ' 123 ';

    form.intValue.$setViewValue(whitespaceValue);
    $scope.$digest();

    expect($scope.models.intValue).to.equal(undefined);
    expect(form.intValue.$valid).to.equal(false);
  });
});
