/* global inject expect */

describe('test/client-unit/services/AccountService', () => {
  let Accounts;
  let $httpBackend;
  let $interval;
  let $verifyNoPendingTasks;

  beforeEach(module('bhima.services', 'bhima.mocks', 'angularMoment', 'bhima.constants'));

  beforeEach(inject((_$httpBackend_, AccountService, MockDataService, _$interval_, _$verifyNoPendingTasks_) => {
    $httpBackend = _$httpBackend_;
    $interval = _$interval_;
    $verifyNoPendingTasks = _$verifyNoPendingTasks_;

    Accounts = AccountService;

    $httpBackend.when('GET', '/accounts/')
      .respond(200, MockDataService.accounts());

    $httpBackend.when('GET', '/accounts/1')
      .respond(200, { id : 1, number : 1, name : 'First Account' });

    $httpBackend.when('GET', '/accounts/2')
      .respond(200, { id : 2, number : 2, name : 'Second Account' });

    $httpBackend.when('GET', '/accounts/3')
      .respond(200, { id : 3, number : 3, name : 'Third Account' });
  }));

  // throws if there are more outstanding requests
  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
    $verifyNoPendingTasks('$interval');
  });

  it('#read() will fire only a single HTTP GET request when called mutliple times in a row', () => {
    const NUM_REQUESTS = 10;
    let count = NUM_REQUESTS;
    while (count--) {
      Accounts.read();
    }

    $interval.flush();

    // this would throw if too many requests were called.
    expect(() => $httpBackend.flush(1)).not.to.throw();
    expect(() => $httpBackend.flush(1)).to.throw();
  });

  it('#read() will fire multiple HTTP GET requests for different parameters', () => {
    const NUM_REQUESTS = 3;
    let count = NUM_REQUESTS;

    do {
      Accounts.read(count);
    } while (count--);

    $interval.flush();

    // this would throw if too many requests were called.
    expect(() => $httpBackend.flush(4)).not.to.throw();
    expect(() => $httpBackend.flush(1)).to.throw();
  });

  it('#read() will return different results based on the parameters passed in', () => {
    let a;
    let b;

    Accounts.read(1)
      .then(res => { a = res; });

    Accounts.read(2)
      .then(res => { b = res; });

    $interval.flush();
    $httpBackend.flush();

    const resA = { id : 1, number : 1, name : 'First Account' };
    const resB = { id : 2, number : 2, name : 'Second Account' };

    expect(a).to.deep.equal(resA);
    expect(b).to.deep.equal(resB);
  });

  it('#read() will bust cached values with a third parameter', () => {
    let count = 10;

    while (count--) {
      // third parameter will bust the cache
      Accounts.read(1, {}, true);
    }

    // this would throw if too many requests were called.
    expect(() => $httpBackend.flush(10)).not.to.throw();
    expect(() => $httpBackend.flush(1)).to.throw();
  });
});
