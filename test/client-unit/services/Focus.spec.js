/* global inject,  chai */
describe('test/client-unit/services/Focus', () => {

  let $scope;
  let $compile;
  let $timeout;
  let focus;
  let element;

  // utility function
  const find = (elm, selector) => elm[0].querySelector(selector);

  beforeEach(module(
    'bhima.services',
  ));

  beforeEach(inject((_$compile_, _$rootScope_, _$timeout_, _$window_, _focus_) => {
    $scope = _$rootScope_.$new();
    $compile = _$compile_;
    $timeout = _$timeout_;
    focus = _focus_;

    element = angular.element(`
      <form>
        <input id="row1" name="row1" ng-model="models.row1">
        <input id="row2" name="row2" ng-model="models.row2">
      </form>
    `);
    $compile(element)($scope);

    // replace the getElementById for having the custom template
    // for our Focus service
    _$window_.document.getElementById = (id) => find(element, `#${id}`);
    $scope.$digest();
  }));

  it('should focus on an element if focus() has a good id', () => {
    // element to focus on : row1
    const input = find(element, '#row1');
    const spy = chai.spy.on(input, 'focus');

    // focus on the element with id = 'row1'
    focus('row1');
    $timeout.flush();

    expect(spy).to.have.been.called();
  });

  it('should not focus on element if focus() is called with a bad id', () => {
    // element to focus on : row1
    const input = find(element, '#row1');
    const spy = chai.spy.on(input, 'focus');

    // set the focus on the element with id = 'row2'
    focus('row2');
    $timeout.flush();
    expect(spy).to.not.have.been.called();

    // set the focus on nothing
    focus();
    $timeout.flush();
    expect(spy).to.not.have.been.called();
  });

});
