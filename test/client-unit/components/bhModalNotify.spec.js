/* eslint no-unused-expressions:off */
/* global inject, */

describe('test/client-unit/components/bhModalNotify', () => {

  const template = `
    <bh-modal-notify error="someError"></bh-modal-notify>
  `;

  beforeEach(module('pascalprecht.translate', 'templates', 'bhima.services', 'bhima.components', 'ui.bootstrap'));

  let $scope;
  let $compile;
  let $translate;
  let element;

  let $flushPendingTasks;

  const find = (elm, selector) => elm[0].querySelector(selector);

  beforeEach(inject((_$rootScope_, _$compile_, _$flushPendingTasks_, _$translate_) => {
    $compile = _$compile_;
    $scope = _$rootScope_.$new();
    $translate = _$translate_;
    $flushPendingTasks = _$flushPendingTasks_;

    element = $compile(angular.element(template))($scope);

    $scope.$digest();
  }));

  it('is not visible when no error message is defined', () => {
    const icon = find(element, '.fa');
    expect(icon).to.equal(null);
  });

  it('is visible when error property is set on component', () => {
    $scope.someError = {
      data : { status : 400, description : 'An Error Occurred', code : 'ERROR' },
    };

    $scope.$digest();

    const icon = find(element, '.fa');
    const hasTimesClass = angular.element(icon).hasClass('fa-times');
    expect(hasTimesClass).to.equal(true);
  });

  it('removes the error message when fa-times is clicked', () => {
    $scope.someError = {
      data : { code : 404, message : 'NotFound' },
    };

    $scope.$digest();

    // assert that the message is visible
    const icon = find(element, '.fa');
    const hasTimesClass = angular.element(icon).hasClass('fa-times');
    expect(hasTimesClass).to.equal(true);

    // click on the icon
    icon.click();
    $scope.$digest();

    const closeIcon = find(element, '.fa');
    expect(closeIcon).to.equal(null);
  });

  it('removes the error message when the $timeout TTL expires', () => {
    $scope.someError = {
      data : { code : 404, message : 'NotFound' },
    };

    $scope.$digest();

    // assert that the message is visible
    const icon = find(element, '.fa');
    const hasTimesClass = angular.element(icon).hasClass('fa-times');
    expect(hasTimesClass).to.equal(true);

    // flush the TTL
    $flushPendingTasks();
    $scope.$digest();

    const closeIcon = find(element, '.fa');
    expect(closeIcon).to.equal(null);
  });

  it('shows info message with info style when only value is given', () => {
    const componentTemplate = `
      <bh-modal-notify value="someValue"></bh-modal-nofify>
    `;
    const compiled = $compile(angular.element(componentTemplate))($scope);
    $scope.someValue = 'Info Message';
    const translated = $translate.instant($scope.someValue);
    $scope.$digest();

    const notificationClass = find(compiled, '.notification-info');
    const message = find(angular.element(notificationClass), 'span');
    const text = angular.element(message).text();
    expect(notificationClass).to.exist;
    expect(translated).to.equal(text);
  });

  it('shows success message with success style when the type is given', () => {
    const componentTemplate = `
      <bh-modal-notify type="success" value="someValue"></bh-modal-nofify>
    `;
    const compiled = $compile(angular.element(componentTemplate))($scope);
    $scope.someValue = 'Success Message';
    const translated = $translate.instant($scope.someValue);
    $scope.$digest();

    const notificationClass = find(compiled, '.notification-success');
    const message = find(angular.element(notificationClass), 'span');
    const text = angular.element(message).text();
    expect(notificationClass).to.exist;
    expect(translated).to.equal(text);
  });

  it('shows warning message with warn style when the type is given', () => {
    const componentTemplate = `
      <bh-modal-notify type="warn" value="someValue"></bh-modal-nofify>
    `;
    const compiled = $compile(angular.element(componentTemplate))($scope);
    $scope.someValue = 'Warning Message';
    const translated = $translate.instant($scope.someValue);
    $scope.$digest();

    const notificationClass = find(compiled, '.notification-warn');
    const message = find(angular.element(notificationClass), 'span');
    const text = angular.element(message).text();
    expect(notificationClass).to.exist;
    expect(translated).to.equal(text);
  });

  it('shows error message with error style when the type is given', () => {
    const componentTemplate = `
      <bh-modal-notify type="error" value="someValue"></bh-modal-nofify>
    `;
    const compiled = $compile(angular.element(componentTemplate))($scope);
    $scope.someValue = 'Error Message';
    const translated = $translate.instant($scope.someValue);
    $scope.$digest();

    const notificationClass = find(compiled, '.notification-error');
    const message = find(angular.element(notificationClass), 'span');
    const text = angular.element(message).text();
    expect(notificationClass).to.exist;
    expect(translated).to.equal(text);
  });

  it('shows danger message with danger style when the type is given', () => {
    const componentTemplate = `
      <bh-modal-notify type="danger" value="someValue"></bh-modal-nofify>
    `;
    const compiled = $compile(angular.element(componentTemplate))($scope);
    $scope.someValue = 'Danger Message';
    const translated = $translate.instant($scope.someValue);
    $scope.$digest();

    const notificationClass = find(compiled, '.notification-danger');
    const message = find(angular.element(notificationClass), 'span');
    const text = angular.element(message).text();
    expect(notificationClass).to.exist;
    expect(translated).to.equal(text);
  });

  it('loads only a style for the corresponding type given', () => {
    const componentTemplate = `
      <bh-modal-notify type="danger" value="someValue"></bh-modal-nofify>
    `;
    const dangerComponentAsked = $compile(angular.element(componentTemplate))($scope);
    $scope.$digest();

    const successComponentLoaded = find(dangerComponentAsked, '.notification-success');
    expect(successComponentLoaded).to.equal(null);
  });

});
