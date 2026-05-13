/* eslint no-unused-expressions:off */
/* global inject, */

describe('test/client-unit/components/bhHiddenField', () => {

  const template = `
    <bh-hidden-field show-text="OPEN" hide-text="CLOSE">
      <p id="test">TEST</p>
    </bh-hidden-field>
  `;

  // make sure the
  beforeEach(module('pascalprecht.translate', 'bhima.services', 'bhima.components', 'templates'));

  let $scope;
  let $compile;
  let element;

  beforeEach(inject((_$rootScope_, _$compile_) => {
    $scope = _$rootScope_.$new();
    $compile = _$compile_;

    element = angular.element(template);
    $compile(element)($scope);
    $scope.$digest();
  }));

  // jqLite's "find" only looks at class names.  Mock a better find.
  const find = (elm, selector) => elm[0].querySelector(selector);

  it('should hide the hidden field by default', () => {
    const transclusion = find(element, '[bh-hidden-field-transclude]');
    expect(transclusion).not.to.exist;
  });

  it('should show the hidden field when toggled', () => {
    const toggle = find(element, '[bh-hidden-field-toggle]');
    angular.element(toggle).click();

    $scope.$digest();

    const transclusion = find(element, '[bh-hidden-field-transclude]');
    expect(transclusion).to.exist;

    const content = find(element, '#test');
    expect(content).to.exist;
    expect(content).to.contain.text('TEST');
  });

  it('should hide the data again when clicked twice', () => {

    // click to show data!
    const toggle = find(element, '[bh-hidden-field-toggle]');
    angular.element(toggle).click();

    $scope.$digest();

    let transclusion = find(element, '[bh-hidden-field-transclude]');
    expect(transclusion).to.exist;

    const content = find(element, '#test');
    expect(content).to.exist;
    expect(content).to.contain.text('TEST');

    // click to hide data!
    angular.element(toggle).click();
    $scope.$digest();

    transclusion = find(element, '[bh-hidden-field-transclude]');
    expect(transclusion).not.to.exist;
  });

});
