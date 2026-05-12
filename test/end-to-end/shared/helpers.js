/**
 * This file contains utilities that are useful in tests, but not specifically
 * tied to forms or modules.
 */

// DISABLED: const PATH_CLEAN_REGEXP = /^#!|^#|^!/g;

// gets a random number within the range(0, n)
exports.random = function random(n) {
  return Math.floor(((n) * Math.random()) + 1);
};

// // wrapper for browser navigation without reloading the page
// exports.navigate = async function navigate(browserPath) {
//   const destination = browserPath.replace(PATH_CLEAN_REGEXP, '');
//   await browser.setLocation(destination);
// };

// // get the browser path after the hash
// exports.getCurrentPath = async function getCurrentPath() {
//   const url = await browser.getCurrentUrl();

//   const partial = url.split('#!')[1];
//   partial.replace(PATH_CLEAN_REGEXP, '');

//   return `#!${partial}`;
// };

// shared data
exports.data = {

  // location IDs for the location select component
  locations : [
    'DBE330B65CDE48308C30DC00ECCD1A5F', // Democratic Republic of the Congo
    'F6FC74697E5845CBB87CF08AF93EDADE', // Kinshasa (province),
    '0404E9EAEBD64F20B1F86DC9F9313450', // Lukunga,
    '1f162a10-9f67-4788-9eff-c1fea42fcc9b', // Gombe
  ],
};
