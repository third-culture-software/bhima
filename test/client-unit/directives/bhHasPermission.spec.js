/* global inject, expect, chai */
describe('test/client-unit/directives/bhHasPermission directive', () => {
  let $scope;
  let $compile;
  let element;
  let SessionMock;

  beforeEach(module('bhima.directives', ($provide) => {
    // Create a mock SessionService with chai-chai.spy
    SessionMock = { hasUserAction : (perm) => perm };

    // Register the mock with Angular's dependency injection
    $provide.value('SessionService', SessionMock);
  }));

  // $compile and $rootScope are injected using angular name-based dependency injection
  beforeEach(inject((_$compile_, $rootScope) => {
    $scope = $rootScope.$new();
    $compile = _$compile_;
  }));

  function compileDirective(permissionValue, hasPermission) {
    // Set the mock behavior for this test
    chai.spy.on(SessionMock, 'hasUserAction', () => hasPermission);

    // Set up the permission value in the scope
    $scope.testPermission = permissionValue;

    // Create the element with our directive
    element = angular.element(`
      <div id="parent">
        <button id="testElement" bh-has-permission="testPermission">
          Test Button
        </button>
      </div>
    `);

    // Compile the element with the scope
    $compile(element)($scope);
    $scope.$digest();

    return element;
  }

  it('should keep the element when the user has the required permission', () => {
    const permissionValue = 'VIEW_REPORTS';
    const compiledElement = compileDirective(permissionValue, true);

    // Verify the button is still in the DOM
    const buttonElement = compiledElement.find('#testElement');

    expect(buttonElement.length).to.equal(1);
    expect(SessionMock.hasUserAction).to.have.been.called.with(permissionValue);
  });

  it('should remove the element when the user does not have the required permission', () => {
    const permissionValue = 'EDIT_REPORTS';
    const compiledElement = compileDirective(permissionValue, false);

    // Verify the button has been removed from the DOM
    const buttonElement = compiledElement.find('#testElement');

    expect(buttonElement.length).to.equal(0);
    expect(SessionMock.hasUserAction).to.have.been.called.with(permissionValue);
  });

  it('should handle multiple elements with different permissions', () => {
    // Set up multiple permission values
    $scope.allowedPermission = 'VIEW_PATIENTS';
    $scope.deniedPermission = 'DELETE_PATIENTS';

    // Configure spy to return true for VIEW_PATIENTS and false for DELETE_PATIENTS
    chai.spy.on(SessionMock, 'hasUserAction', (permission) => (permission === 'VIEW_PATIENTS'));

    // Create an element with multiple children using our directive
    element = angular.element(`
      <div id="parent">
        <button id="allowedElement" bh-has-permission="allowedPermission">
          Allowed Button
        </button>
        <button id="deniedElement" bh-has-permission="deniedPermission">
          Denied Button
        </button>
      </div>
    `);

    // Compile the element with the scope
    $compile(element)($scope);
    $scope.$digest();

    // Verify only the allowed element remains
    const allowedElement = element.find('#allowedElement');
    const deniedElement = element.find('#deniedElement');

    expect(allowedElement.length).to.equal(1);
    expect(deniedElement.length).to.equal(0);
    expect(SessionMock.hasUserAction).to.have.been.called.with('VIEW_PATIENTS');
    expect(SessionMock.hasUserAction).to.have.been.called.with('DELETE_PATIENTS');
  });

  it('should handle undefined permission values', () => {
    // Test with undefined permission
    $scope.undefinedPermission = undefined;

    chai.spy.on(SessionMock, 'hasUserAction', () => false);

    element = angular.element(`
      <div id="parent">
        <button id="testElement" bh-has-permission="undefinedPermission">
          Test Button
        </button>
      </div>
    `);

    $compile(element)($scope);
    $scope.$digest();

    // Verify behavior with undefined permission
    const buttonElement = element.find('#testElement');

    expect(buttonElement.length).to.equal(0);
    expect(SessionMock.hasUserAction).to.have.been.called.with(undefined);
  });

  it('should properly handle complex HTML structures', () => {
    // Set up permission value
    $scope.noAccess = 'RESTRICTED_AREA';

    // Configure spy to return false
    chai.spy.on(SessionMock, 'hasUserAction', () => false);

    // Create an element with nested structure
    element = angular.element(`
      <div id="parent">
        <div class="wrapper" bh-has-permission="noAccess">
          <h1>Header</h1>
          <p>Paragraph</p>
          <button>Button</button>
        </div>
      </div>
    `);

    // Compile the element with the scope
    $compile(element)($scope);
    $scope.$digest();

    // Verify the entire wrapper and its contents are removed
    const wrapperElement = element.find('.wrapper');
    const headerElement = element.find('h1');
    const paragraphElement = element.find('p');
    const buttonElement = element.find('button');

    expect(wrapperElement.length).to.equal(0);
    expect(headerElement.length).to.equal(0);
    expect(paragraphElement.length).to.equal(0);
    expect(buttonElement.length).to.equal(0);
  });

  it('should re-evaluate permissions when scope values change', () => {
    // Set up initial permission
    $scope.dynamicPermission = 'INITIAL_PERMISSION';

    // First call returns true
    chai.spy.on(SessionMock, 'hasUserAction', () => true);

    element = angular.element(`
      <div id="parent">
        <button id="testElement" bh-has-permission="dynamicPermission">
          Test Button
        </button>
      </div>
    `);

    $compile(element)($scope);
    $scope.$digest();

    // Verify button exists initially
    let buttonElement = element.find('#testElement');
    expect(buttonElement.length).to.equal(1);

    // Now change the permission and make the spy return false
    $scope.dynamicPermission = 'CHANGED_PERMISSION';
    SessionMock.hasUserAction = chai.spy(() => false);

    // Need to recompile since we're testing a one-time binding
    element = $compile(element)($scope);
    $scope.$digest();

    // Now button should be removed
    buttonElement = element.find('#testElement');
    expect(buttonElement.length).to.equal(0);
  });
});
