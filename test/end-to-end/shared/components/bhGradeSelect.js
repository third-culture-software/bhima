const TU = require('../TestUtils');
const { by } = require('../TestUtils');

const selector = '[bh-grade-select]';

module.exports = {

  /**
   * Select a grade
   * @param {string} grade - desired grade
   * @param {string} id - Id for the grade (optional)
   * @returns {Promise} for selecting the grade
   */
  set : async function set(grade, id) {
    const locator = (id) ? by.id(id) : selector;
    const target = await TU.locator(locator);

    await target.click();

    return TU.uiSelect('$ctrl.gradeUuid', grade, target);
  },
};
