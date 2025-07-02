// Detect missing translation items between translation files
// USAGE:  node tfcomp.js ath1Eng path2Fr
// Where path1Eng and path2Fr : paths to folders containing json files of translation

const path = require('path');
const fs = require('fs');
const process = require('process');
const { exit } = require('process');

// Make sure we have two paths
if (process.argv.length < 4) {
  /* eslint-disable no-console */
  console.log('Usage:  node tfcomp.js path1English path2French');
  /* eslint-enable no-console */
  exit();
}

// get the files directory
const pathEn = process.argv[2];
const pathFr = process.argv[3];

const EN_PATH = path.resolve(process.cwd(), pathEn);
const FR_PATH = path.resolve(process.cwd(), pathFr);

const enJsonNames = fs.readdirSync(EN_PATH);
const frJsonNames = fs.readdirSync(FR_PATH);

let errMsg = '';

// Arrays to save differences in
let enMissList = null;
let frMissList = null;
const enFileMissList = [];
const frFileMissList = [];

const jsonFiles = buildJsonFileArray();

jsonFiles.forEach((jsonFile) => {

  // Arrays to save differences in
  enMissList = [];
  frMissList = [];

  if (jsonFile.en && jsonFile.fr) {

    // load JSON files
    const enTranslateObject = JSON.parse(fs.readFileSync(jsonFile.en));
    const frTranslateObject = JSON.parse(fs.readFileSync(jsonFile.fr));

    checkSubDict(enTranslateObject, frTranslateObject, '');
  } else if (!jsonFile.en) {
    // add to the missed files list
    enFileMissList.push(jsonFile.fr);
  } else {
    frFileMissList.push(jsonFile.en);
  }

  // Report items in french translation but missing from english translation
  if (enMissList.length > 0) {
    errMsg += `\nMissing from ${jsonFile.en}: \n`;
    enMissList.sort();
    errMsg += enMissList.join('\n');
    errMsg += '\n\n';
  }

  // Report items in filename1 but missing from filename2
  if (frMissList.length > 0) {
    errMsg += `Missing from ${jsonFile.fr}: \n`;
    frMissList.sort();
    errMsg += frMissList.join('\n');
    errMsg += '\n\n';
  }
});

if (enFileMissList.length > 0) {
  errMsg += '\n Missing english correspondent file for : \n';
  enFileMissList.sort();
  errMsg += enFileMissList.join('\n');
  errMsg += '\n\n';
}

if (frFileMissList.length > 0) {
  errMsg += '\n Missing french correspondent file for : \n';
  frFileMissList.sort();
  errMsg += frFileMissList.join('\n');
  errMsg += '\n\n';
}

if (errMsg) {
  /* eslint-disable no-console */
  console.error(errMsg);
  /* eslint-enable no-console */
  exit();
}

function buildJsonFileArray() {
  const jsonList = [];

  enJsonNames.forEach((enJsonName) => {
    const ind = frJsonNames.indexOf(enJsonName);
    const item = {
      en : path.resolve(EN_PATH, enJsonName),
      fr : null,
    };

    if (ind >= 0) {
      item.fr = path.resolve(FR_PATH, frJsonNames[ind]);
    }

    jsonList.push(item);
  });

  const missedFromEnJsonNames = frJsonNames.filter((frJsonName) => {
    return enJsonNames.indexOf(frJsonName) < 0;
  });

  missedFromEnJsonNames.forEach((missedFromEnJsonName) => {
    jsonList.push({
      en : null,
      fr : path.resolve(FR_PATH, missedFromEnJsonName),
    });
  });

  return jsonList;
}

function checkSubDict(enTranslateObject, frTranslateObject, keyPath) {

  // Compare the dictionaries recursively
  let i;
  let key;

  // Make sure the items are both arrays (may come in as a string)
  // If it comes in as a string, that means it is a single value,
  // not a dictionary so it has no children to compare
  let enTranslateObjectDict = enTranslateObject;
  if (typeof enTranslateObject === 'string') {
    enTranslateObjectDict = {};
  }
  let frTranslateObjectDict = frTranslateObject;
  if (typeof frTranslateObject === 'string') {
    frTranslateObjectDict = {};
  }

  // Figure out which keys are missing from english translate json file and french
  const enKeys = Object.keys(enTranslateObjectDict).sort();
  const frKeys = Object.keys(frTranslateObjectDict).sort();

  const missingListFromEn = frKeys.filter((val) => { return enKeys.indexOf(val) < 0; });
  const missingListFromFr = enKeys.filter((val) => { return frKeys.indexOf(val) < 0; });

  // figure out the common keys
  let common = enKeys.filter((val) => { return frKeys.indexOf(val) >= 0; });

  // See also at the french file if there is some common keys omitted
  for (i = 0; i < frKeys.length; i++) {
    key = frKeys[i];
    if (enKeys.indexOf(key) >= 0 && common.indexOf(key) < 0) {
      common.push(key);
    }
  }

  common = common.sort();

  // Process the keys missing from d1
  if (missingListFromEn.length > 0) {
    for (i = 0; i < missingListFromEn.length; i++) {
      if (keyPath.length > 0) {
        enMissList.push(`  ${keyPath}.${missingListFromEn[i]}`);
      } else {
        enMissList.push(`  ${missingListFromEn[i]}`);
      }
    }
  }

  // Process the keys missing from d2
  if (missingListFromFr.length > 0) {
    for (i = 0; i < missingListFromFr.length; i++) {
      if (path.length > 0) {
        frMissList.push(`  ${path}.${missingListFromFr[i]}`);
      } else {
        frMissList.push(`  ${missingListFromFr[i]}`);
      }
    }
  }

  // Handle common values that are dictionaries (recursively)
  for (i = 0; i < common.length; i++) {
    key = common[i];
    const enVal = enTranslateObjectDict[key];
    const frVal = frTranslateObjectDict[key];
    if (typeof enVal === 'object' || typeof frVal === 'object') {
      if (path.length > 0) {
        checkSubDict(enTranslateObjectDict[key], frTranslateObjectDict[key], `${path}.${key}`);
      } else {
        checkSubDict(enTranslateObjectDict[key], frTranslateObjectDict[key], key);
      }
    }
  }

}
