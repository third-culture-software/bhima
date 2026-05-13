/* eslint no-unused-expressions:"off" */


const _ = require('lodash');
const helpers = require('../helpers');

// this makes render tests for reports the lazy way.  Just give it a target and it will write describe() tests for you.
module.exports = function LazyTester(target, keys, options = {}) {
  return function LazyTest() {
    const params = _.clone(options);

    // renders
    const invalid = _.merge({ renderer : 'unknown' }, params);
    const json = _.merge({ renderer : 'json' }, params);
    const html = _.merge({ renderer : 'html' }, params);

    it(`GET ${target} should return Bad Request for invalid renderer`, () => {
      return agent.get(target)
        .query(invalid)
        .then((result) => {
          helpers.api.errored(result, 400, 'ERRORS.INVALID_RENDERER');
        })
        .catch(helpers.handler);
    });

    it(`GET ${target} should return JSON data for 'json' rendering target`, () => {
      return agent.get(target)
        .query(json)
        .then(expectJSONReport)
        .catch(helpers.handler);
    });

    it(`GET ${target} should return HTML data for 'html' rendering target`, () => {
      return agent.get(target)
        .query(html)
        .then(expectHTMLReport)
        .catch(helpers.handler);
    });

    // validate a JSON response
    /**
     *
     * @param result
     */
    function expectJSONReport(result) {
      expect(result).to.have.status(200);
      expect(result).to.be.json;
      expect(result.headers['content-type']).to.equal('application/json; charset=utf-8');
      expect(result.body).to.not.be.empty;

      // only assert keys if passed in to the function
      if (keys) {
        expect(result.body).to.contain.all.keys(keys);
      }
    }

    // validate an HTML response
    /**
     *
     * @param result
     */
    function expectHTMLReport(result) {
      expect(result.headers['content-type']).to.equal('text/html; charset=utf-8');
      expect(result.text).to.not.be.empty;
    }

  };
};
