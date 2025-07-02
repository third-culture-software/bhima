/* global inject, expect */
describe('test/client-unit/services/PrototypeApiService', () => {

  // shared common data
  let api;
  let httpBackend;
  const url = '/bizarre/';

  // load bhima.services
  beforeEach(() => {
    module('bhima.services');
    module('angularMoment');
  });

  const responses = {
    error : { error : 'resource not found.' },
    list : [{ id : 1 }, { id : 2 }],
    detail : { id : 2, hello : 'world' },
    create : { id : 1 },
    update : { id : 1, hello : 'monde' },
    search : { id : 2 },
  };

  // bind the services as $injects
  beforeEach(inject((_PrototypeApiService_, $httpBackend) => {
    const Api = _PrototypeApiService_;

    // make the API available to test
    api = new Api(url);

    httpBackend = $httpBackend;

    // Set up a fake server backend
    httpBackend.when('POST', url)
      .respond(201, responses.create);

    httpBackend.when('GET', url)
      .respond(200, responses.list);

    httpBackend.when('GET', url.concat(2))
      .respond(200, responses.detail);

    httpBackend.when('GET', url.concat('search?name=bob&limit=50'))
      .respond(200, responses.search);

    httpBackend.when('GET', url.concat(3))
      .respond(404, responses.error);

    httpBackend.when('PUT', url.concat(1))
      .respond(200, responses.update);

    httpBackend.when('DELETE', url.concat(1))
      .respond(201);
  }));

  // make sure $httpBackend is clean after tests
  afterEach(() => {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  // POST test
  it('#create() fires a properly formed POST request', () => {
    httpBackend.expectPOST(url);

    api.create({ hello : 'world' })
      .then(res => expect(res).to.eql(responses.create));

    httpBackend.flush();
  });

  // GET tests
  it('#read() fires a properly formed GET request', () => {
    httpBackend.expectGET(url);

    api.read()
      .then(res => expect(res).to.eql(responses.list));

    httpBackend.flush();
    httpBackend.expectGET(url.concat(2));

    api.read(2)
      .then(res => expect(res).to.eql(responses.detail));

    httpBackend.flush();
  });

  it('#read() handles errors appropriately', () => {
    httpBackend.expectGET(url.concat(3));

    api.read(3)
      .catch(err => expect(err.data).to.eql(responses.error));

    httpBackend.flush();
  });

  it('#search() formats a search query', () => {
    const params = { name : 'bob', limit : 50 };

    httpBackend.expectGET(url.concat('search?name=bob&limit=50'));

    api.search(params)
      .then(res => expect(res).to.eql(responses.search));

    httpBackend.flush();

  });

  it('#update() fires a properly formed PUT request', () => {
    httpBackend.expectPUT(url.concat(1));

    api.update(1, { data : 'title' })
      .then(res => expect(res).to.eql(responses.update));

    httpBackend.flush();
  });

  it('#delete() fires a properly formed DELETE request', () => {
    httpBackend.expectDELETE(url.concat(1));

    api.delete(1)
      .then(res => expect(res).to.eql(responses.delete));

    httpBackend.flush();
  });
});
