/* global inject, expect */
describe('test/client-unit/services/UniqueValidatorService', () => {

  // these will be injected in the beforeEach() calls
  let UniqueValidatorService;
  let $httpBackend;
  let $rootScope;

  // this is the test URL, as described in the validator documentation
  const url = '/entity/attribute';

  const targets = {
    exists : '/entity/attribute/123/exists',
    dne : '/entity/attribute/321/exists',
  };

  beforeEach(
    module('pascalprecht.translate', 'angularMoment', 'bhima.services')
  );

  beforeEach(inject((_$httpBackend_, _UniqueValidatorService_, _$rootScope_) => {
    UniqueValidatorService = _UniqueValidatorService_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;

    $httpBackend.when('GET', targets.exists)
      .respond(200, true);

    $httpBackend.when('GET', targets.dne)
      .respond(200, false);

  }));

  it('returns true on existant targets', () => {
    let existence;

    // send the GET request to /entity/attribute/123/exists
    UniqueValidatorService.check(url, 123)
      .then(exists => existence = exists);

    $httpBackend.expectGET(targets.exists);
    $httpBackend.flush();

    // resolve promises
    $rootScope.$digest();

    // expect the "server" to return true through the service
    expect(existence).to.equal(true);
  });

  it('returns false on non-existant targets', () => {
    let existence;

    // send the GET request to /entity/attribute/321/exists
    UniqueValidatorService.check(url, 321)
      .then(exists => existence = exists);

    $httpBackend.expectGET(targets.dne);
    $httpBackend.flush();

    // resolve promises
    $rootScope.$digest();

    // expect the "server" to return true through the service
    expect(existence).to.equal(false);
  });

  // make sure $httpBackend is clean after tests
  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });
});
