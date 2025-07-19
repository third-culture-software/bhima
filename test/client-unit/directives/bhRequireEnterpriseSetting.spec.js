/* global inject, expect, chai */
describe('test/client-unit/directives/bhRequireEnterpriseSetting directive', () => {
  let $scope;
  let $compile;
  let element;
  let SessionMock;

  beforeEach(module('bhima.directives', ($provide) => {
    SessionMock = { isSettingEnabled : chai.spy() };
    $provide.value('SessionService', SessionMock);
  }));

  // $compile and $rootScope are injected using angular name-based dependency injection
  beforeEach(inject((_$compile_, $rootScope) => {
    $scope = $rootScope.$new();
    $compile = _$compile_;
  }));

  function compileDirective(settingName, isEnabled) {
    // Set the mock behavior for this test
    SessionMock.isSettingEnabled = chai.spy(() => isEnabled);

    // Create the element with our directive
    element = angular.element(`
      <div id="parent">
        <button id="testElement" bh-require-enterprise-setting="${settingName}">
          Test Button
        </button>
      </div>
    `);

    // Compile the element with the scope
    $compile(element)($scope);
    $scope.$digest();

    return element;
  }

  it('should keep the element when the specified setting is enabled', () => {
    const settingName = 'myEnabledSetting';
    const compiledElement = compileDirective(settingName, true);

    // Verify the button is still in the DOM
    const buttonElement = compiledElement.find('#testElement');

    expect(buttonElement.length).to.equal(1);
    expect(SessionMock.isSettingEnabled).to.have.been.called.with(settingName);
  });

  it('should remove the element when the specified setting is disabled', () => {
    const settingName = 'myDisabledSetting';
    const compiledElement = compileDirective(settingName, false);

    // Verify the button has been removed from the DOM
    const buttonElement = compiledElement.find('#testElement');

    expect(buttonElement.length).to.equal(0);
    expect(SessionMock.isSettingEnabled).to.have.been.called.with(settingName);
  });

  it('should handle multiple elements with different settings', () => {
    // Mock behavior for different settings
    SessionMock.isSettingEnabled = chai.spy((setting) => setting === 'enabledSetting');

    // Create an element with multiple children using our directive
    element = angular.element(`
      <div id="parent">
        <button id="enabledElement" bh-require-enterprise-setting="enabledSetting">
          Enabled Button
        </button>
        <button id="disabledElement" bh-require-enterprise-setting="disabledSetting">
          Disabled Button
        </button>
      </div>
    `);

    // Compile the element with the scope
    $compile(element)($scope);
    $scope.$digest();

    // Verify only the enabled element remains
    const enabledElement = element.find('#enabledElement');
    const disabledElement = element.find('#disabledElement');

    expect(enabledElement.length).to.equal(1);
    expect(disabledElement.length).to.equal(0);
  });

  it('should handle empty setting name', () => {
    // Empty setting name behavior
    const emptySettingName = '';
    const compiledElement = compileDirective(emptySettingName, false);

    // Verify behavior with empty setting name
    const buttonElement = compiledElement.find('#testElement');

    expect(buttonElement.length).to.equal(0);
    expect(SessionMock.isSettingEnabled).to.have.been.called.with(emptySettingName);
  });

  it('should properly handle complex HTML structures', () => {
    SessionMock.isSettingEnabled = chai.spy(() => false);

    element = angular.element(`
      <div id="parent">
        <div class="wrapper" bh-require-enterprise-setting="complexSetting">
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
});
