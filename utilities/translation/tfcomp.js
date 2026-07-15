// Detect missing translation items between translation files
// USAGE:  node tfcomp.js ath1Eng path2Fr
// Where path1Eng and path2Fr : paths to folders containing json files of translation

const path = require('node:path');
const fs = require('node:fs')

// --- Configuration & Input Validation ---
const [,, pathEnInput, pathFrInput] = process.argv;

if (!pathEnInput || !pathFrInput) {
  console.log('Usage:  node tfcomp.js path1English path2French');
  process.exit(0);
}

const EN_PATH = path.resolve(process.cwd(), pathEnInput);
const FR_PATH = path.resolve(process.cwd(), pathFrInput);

const enJsonNames = fs.readdirSync(EN_PATH);
const frJsonNames = fs.readdirSync(FR_PATH);

let errMsg = '';
const enFileMissList = [];
const frFileMissList = [];

const jsonFiles = buildJsonFileArray(enJsonNames, frJsonNames);

jsonFiles.forEach((jsonFile) => {
  const currentEnMissList = [];
  const currentFrMissList = [];

  if (jsonFile.en && jsonFile.fr) {
    const enTranslateObject = JSON.parse(fs.readFileSync(jsonFile.en, 'utf8'));
    const frTranslateObject = JSON.parse(fs.readFileSync(jsonFile.fr, 'utf8'));

    checkSubDict(enTranslateObject, frTranslateObject, '', currentEnMissList, currentFrMissList);
  } else if (!jsonFile.en) {
    enFileMissList.push(jsonFile.fr);
  } else {
    frFileMissList.push(jsonFile.en);
  }

  // Report items missing from English (but present in French)
  if (currentEnMissList.length > 0) {
    errMsg += `\nMissing from ${jsonFile.en}: \n`;
    errMsg += [...currentEnMissList].sort().join('\n');
    errMsg += '\n\n';
  }

  // Report items missing from French (but present in English)
  if (currentFrMissList.length > 0) {
    errMsg += `Missing from ${jsonFile.fr}: \n`;
    errMsg += [...currentFrMissList].sort().join('\n');
    errMsg += '\n\n';
  }
});

// Report missing files
if (enFileMissList.length > 0) {
  errMsg += '\n Missing english correspondent file for : \n';
  errMsg += [...enFileMissList].sort().join('\n');
  errMsg += '\n\n';
}

if (frFileMissList.length > 0) {
  errMsg += '\n Missing french correspondent file for : \n';
  errMsg += [...frFileMissList].sort().join('\n');
  errMsg += '\n\n';
}

if (errMsg) {
  console.error(errMsg);
  process.exit(0);
}

/**
 * Builds an array of objects mapping English file paths to French file paths.
 * @param enNames
 * @param frNames
 */
function buildJsonFileArray(enNames, frNames) {
  const jsonList = [];

  // Map English files to French counterparts
  enNames.forEach((enName) => {
    const frIndex = frNames.indexOf(enName);
    const item = {
      en: path.resolve(EN_PATH, enName),
      fr: frIndex >= 0 ? path.resolve(FR_PATH, frNames[frIndex]) : null,
    };
    jsonList.push(item);
  });

  // Add French files that have no English counterpart
  frNames.forEach((frName) => {
    if (!enNames.includes(frName)) {
      jsonList.push({
        en: null,
        fr: path.resolve(FR_PATH, frName),
      });
    }
  });

  return jsonList;
}

/**
 * Recursively compares two objects and populates the miss lists.
 * @param enObj
 * @param frObj
 * @param keyPath
 * @param enMissList
 * @param frMissList
 */
function checkSubDict(enObj, frObj, keyPath, enMissList, frMissList) {
  // Normalize inputs: if they are strings, treat them as empty objects (no children)
  const enDict = typeof enObj === 'string' ? {} : enObj;
  const frDict = typeof frObj === 'string' ? {} : frObj;

  const enKeys = Object.keys(enDict).sort();
  const frKeys = Object.keys(frDict).sort();

  // Find keys present in French but not in English
  const missingFromEn = frKeys.filter(key => !enKeys.includes(key));
  // Find keys present in English but not in French
  const missingFromFr = enKeys.filter(key => !frKeys.includes(key));

  // Find common keys
  const common = enKeys.filter(key => frKeys.includes(key));

  // Populate the miss lists
  missingFromEn.forEach(key => {
    const prefix = keyPath.length > 0 ? `  ${keyPath}.${key}` : `  ${key}`;
    enMissList.push(prefix);
  });

  missingFromFr.forEach(key => {
    const prefix = keyPath.length > 0 ? `  ${keyPath}.${key}` : `  ${key}`;
    frMissList.push(prefix);
  });

  // Recurse into common keys that are objects
  common.forEach(key => {
    const enVal = enDict[key];
    const frVal = frDict[key];

    if (enVal !== null && typeof enVal === 'object' || frVal !== null && typeof frVal === 'object') {
      const nextPath = keyPath.length > 0 ? `${keyPath}.${key}` : key;
      checkSubDict(enVal, frVal, nextPath, enMissList, frMissList);
    }
  });
}

