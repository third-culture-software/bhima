/* eslint no-unused-expressions:"off" */

const helpers = require('../helpers');

// this makes render tests for reports the lazy way.  Just give it a target and it will write describe() tests for you.
module.exports = function LazyTester(target, keys, options = {}) {
  return function LazyTest() {
    const params = { ...options };

    // renders
    const invalid = { renderer: 'unknown', ...params };
    const json = { renderer: 'json', ...params };
    const html = { renderer: 'html', ...params };

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

    /**
     * @param result
     * @description
     * This function validates that the result is a JSON response. It checks the content type and ensures that the response text is not empty.
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

    /**
     *
     * @param result
     * @description
     * This function validates that the result is an HTML response. It checks the content type and ensures that the response text is not empty.
     */
    function expectHTMLReport(result) {
      expect(result.headers['content-type']).to.equal('text/html; charset=utf-8');
      expect(result.text).to.not.be.empty;
    }
  };
};
