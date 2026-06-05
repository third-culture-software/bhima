/**
 * Hooks for the location select component described in the file
 * bhLocationSelect.js.
 *
 * A user is implicitly selecting a list of UUIDs, via the select dropdowns.
 * Therefore, it makes sense to pass in an array of UUIDs to the set() method
 * and expect an array to be returned from the get() method.
 * @public
 */

const TU = require('../TestUtils');
const { by } = require('../TestUtils');

module.exports = {
  selector : '[data-bh-location-select]',

  /** <select> element models to be used in selectors */
  models :     {
    country :  '$ctrl.country',
    province : '$ctrl.province',
    sector :   '$ctrl.sector',
    village :  '$ctrl.village',
  },

  /**
   * sets the component to the selected uuids for country, province,
   * sector, and village.
   * @function set
   * @param {Array} array - an array of uuids to select in this order: country,
   * province, sector, village
   * @param {string} id - an optional id of the <bh-location-select> component.
   * @returns null
   * @example
   * var components = require('../shared/components');
   * var locations = [
   *   'dbe330b6-5cde-4830-8c30-dc00eccd1a5f', // Democratic Republic of the Congo
   *   'f6fc7469-7e58-45cb-b87c-f08af93edade', // Bas Congo,
   *   '0404e9ea-ebd6-4f20-b1f8-6dc9f9313450', // Tshikapa,
   *   '1f162a10-9f67-4788-9eff-c1fea42fcc9b' // kele
   * ];
   * components.locationSelect.set(locations)
   */
  set : async function set(array, id) {

    /** if an id was passed in, use it as the target */
    const target = (id) ? by.id(id) : this.selector;

    /** <select> element selectors */
    const { models } = this;

    /** go through each select and select the associated uuid */

    /** country <select> */
    const country = await TU.locator(`${target} select[ng-model="${models.country}"]`);
    await country.selectOption(`${array[0]}`);

    /** province <select> */
    const province = await TU.locator(`${target} select[ng-model="${models.province}"]`);
    await province.selectOption(`${array[1]}`);

    /** sector <select> */
    const sector = await TU.locator(`${target} select[ng-model="${models.sector}"]`);
    await sector.selectOption(`${array[2]}`);

    /** village <select> */
    const village = await TU.locator(`${target} select[ng-model="${models.village}"]`);
    return village.selectOption(`${array[3]}`);
  },

  /**
   * return an array of country, province, sector, and village uuids to the
   * caller.  Takes in an option id if there are multiple location selects on
   * a singe page.
   * @function get
   * @param {string} id - the id of the <bh-location-select> component
   * @returns {Array} uuids - an array of uuids for the selected country,
   * province, sector, and village, respectively.
   * @example
   * var components = require('../shared/components');
   *
   * // here we are using the id 'origin-location-select'
   * components.locationSelect('origin-location-select');
   */
  get : async function get(id) {

    /** if an id was passed in, use it as a target */
    const target = (id) ? TU.locator(by.id(id)) : TU.locator(by.css(this.selector));

    /** alias the models */
    const { models } = this;

    /** find each <select> by its model */
    // TODO: WARNING : Needs fixing/testing!
    const country = target.locator(by.model(models.country)).$('option:checked');
    const province = target.locator(by.model(models.province)).$('option:checked');
    const sector = target.locator(by.model(models.sector)).$('option:checked');
    const village = target.locator(by.model(models.village)).$('option:checked');

    /** return the selected values */
    return Promise.all([
      country.getAttribute('value'),
      province.getAttribute('value'),
      sector.getAttribute('value'),
      village.getAttribute('value'),
    ]);
  },
};
