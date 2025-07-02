angular.module('bhima.services')
  .service('PrototypeApiService', PrototypeApiService);

PrototypeApiService.$inject = ['$http', 'util'];

/**
 * @class PrototypeApiService
 *
 * @description
 * This service is the parent/prototype of all API services throughout the
 * application.  It defines the basic methods to be implemented and parameters
 * that are required for each.  Full CRUD is implemented in this service,
 * extending from a base url.
 *
 * Child services are expected to call this prototype service directly to
 * inherit the methods and properties from this service.
 *
 * @example
 * const service = new PrototypeApiService('/interface');
 *
 * // You can now use service.create(), service.update(), service.delete(),
 * // service.read(), and service.search() without any extra work!
 *
 * service.create(data).then(function (res) {
 *   // Yay!  Create success!
 * })
 * .catch(function (err) {
 *   // oh no!  Some error occurred!
 * });
 *
 * service.get(id).then(function (res) {
 *   // Yay!  Got an object!
 * }).catch(function (err) {
 *   // oops.  Something strange happened...
 * });
 *
 * @requires $http
 * @requires util
 * @fixme Please fix some examples below their refer often to the create method
 */
function PrototypeApiService($http, util) {

  // will be passed back as the prototype API service
  function Api(url) {

    // if the developer forgot to call new, call it for them
    if (!(this instanceof Api)) {
      return new Api(url);
    }

    angular.extend(this, { url });
  }

  // bind methods to the prototype
  Api.prototype.create = create;
  Api.prototype.read = read;
  Api.prototype.update = update;
  Api.prototype.delete = remove;
  Api.prototype.search = search;
  Api.prototype.$http = $http;
  Api.prototype.util = util;
  Api.prototype.report = report;
  Api.prototype.count = count;

  // bind functions directly for ease of calling in services which need to
  // modify the functions before executing them.
  Api.create = create;
  Api.read = read;
  Api.update = update;
  Api.delete = remove;
  Api.search = search;
  Api.report = report;
  Api.count = count;

  /**
   * @method read
   *
   * @description
   * Sends an HTTP GET request to the url "/route" or "route/:id".  If an id is
   * provided, the id is appended to the base url before sending the request.
   * Otherwise, the request is made against the base url.
   *
   * Optional parameters may be provided as the second parameter to be passed as
   * query string parameters to $http.
   *
   * @param {Number|String|Null} id - the optional identifier of the URL route.
   * @param {Object|Null} params - optional parameters to be passed to $http
   * @returns {Promise} - the promise with the requested data
   *
   * @example
   * // GETting data from the base /route/
   * service.read().then(function (data) {
   *   // data is an array of values
   * })
   *
   * // GETting data from the /route/:id
   * service.read(id).then(function (data) {
   *   // data is typically an object here
   * });
   *
   * // GETting data with query string params
   * // /route?limit=10&detailed=1
   * service.read(null, { limit : 10, detailed : 1 })
   *   .then(function (data) {
   *     // data is typically an array here
   *   });
   */
  function read(id, parameters = {}, httpParameters = {}) {
    // append the id to the target
    const target = this.url.concat(id || '');

    const options = angular.extend(httpParameters, { params : parameters });

    // send the GET request
    return $http.get(target, options)
      .then(util.unwrapHttpResponse);
  }

  /**
   * @method update
   *
   * @description
   * Sends an HTTP PUT request to the url `/route/:id` with properties to update in
   * the database.  The method removes any identifiers (id, uuid) if they exist
   * on the object to avoid changing references in the database.
   *
   * @param {Number|String|Null} id - the optional identifier of the URL route.
   * @param {Object|Null} data - the changed data to be updated in the database
   * @returns {Promise} - the promise with the full changed object
   *
   * @example
   * // PUT data to the url "/route/1"
   * service.update(1, { name : "Hope" }).then(function (data) {
   *   // data is a JSON with the full record's properties
   * });
   */
  function update(id, data) {

    // remove identifers before update command
    delete data.id;
    delete data.uuid;

    // append the id to the base url
    const target = this.url.concat(id);

    // send the PUT request
    return $http.put(target, data)
      .then(util.unwrapHttpResponse);
  }

  /**
   * @method create
   *
   * @description
   * Sends an HTTP POST request to the url `/route` with the record properties
   * in the HTTP body.
   *
   * @param {Object|Null} data - the record data to be create in the database
   * @returns {Promise} - the promise with the identifier from the database
   *   resolving to the created record identifier
   *
   * @example
   * // POST data to the url "/route"
   * service.create({ text : "Hello World!" }).then(function (data) {
   *   // data an object containing the identifier.  Usually "id" or "uuid"
   * });
   */
  function create(data, params = {}) {

    // the target is the base URL
    const target = this.url;

    // send the POST request
    return $http.post(target, data, { params })
      .then(util.unwrapHttpResponse);
  }

  /**
   * @method delete
   *
   * @description
   * Sends an HTTP DELETE request to the url "/route/:id" to delete an object
   * from the database.  The expected response is a `204 No Content` HTTP status
   * code.
   *
   * @param {Number|String|Null} id - the identifier of the URL route.
   * @returns {Promise} - the promise with the identifier from the database
   *
   * @example
   * // DELETE data with "id" from "/route" interface
   * service.delete({ text : "Hello World!" }).then(function (data) {
   *   // data an object containing the identifier.  Usually "id" or "uuid"
   * });
   */
  function remove(id) {

    // append the id to the base url
    const target = this.url.concat(id);

    // send the DELETE request
    return $http.delete(target)
      .then(util.unwrapHttpResponse);
  }

  /**
   * @method search
   *
   * @description
   * Sends an HTTP GET request to the url "/route/search" with properly formatted
   * query strings to query the database. The expected response is a `200 OK`
   * HTTP status code.
   *
   * @param {Object} parameters - the query conditions to filter data in the database
   * @returns {Promise} - the promise with the identifier from the database
   *
   * @example
   * // GET "/route/search" with formatted query strings
   * service.search({ text : "Hello World!" }).then(function (data) {
   *   // data an object containing the identifier.  Usually "id" or "uuid"
   * });
   */
  function search(parameters) {

    // append 'search' to the base url
    const target = this.url.concat('search');

    // return the query to the controller
    return $http.get(target, { params : parameters })
      .then(util.unwrapHttpResponse);
  }

  /**
   * @method reports
   *
   * @description
   * Sends an HTTP GET request to the url "/route/reports/:id"
   * to get a document as a report.
   *
   * @param {String} param - A parameter for the URL route.
   * @param {String} filetype - the report file type (pdf, json, html)
   * @returns {Promise} - the promise
   */
  function report(param, filetype) {

    // append the id to the base url
    const target = this.url.concat('reports/', param);
    return reportBuilder(target, param, filetype);
  }

  /** report builder */
  function reportBuilder(target, param, filetype) {

    // filetype setup
    const responseType = filetype === 'pdf' ? 'arraybuffer' : null;
    const params = { renderer : filetype };

    // send the GET request
    return $http.get(target, { params, responseType })
      .then(util.unwrapHttpResponse);
  }

  /**
   * @method count
   *
   * @description
   * Sends an HTTP GET request to the url "/route/count" with properly formatted
   * query strings to query the database. The expected response is a `200 OK`
   * HTTP status code.
   *
   * @param {Object} parameters - the query conditions to filter data in the database
   * @returns {Promise} - the promise with the identifier from the database
   *
   * @example
   * // GET "/route/count" with formatted query strings
   * service.count({ text : "Hello World!" }).then(function (data) {
   *   // data an object containing the identifier.  Usually "id" or "uuid"
   * });
   */
  function count() {

    // append 'count' to the base url
    const target = this.url.concat('count');

    // return the query to the controller
    return $http.get(target)
      .then(util.unwrapHttpResponse);
  }

  return Api;
}
