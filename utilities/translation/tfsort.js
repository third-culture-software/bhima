// Rewrite the translation file producing a 'new.json' file that is sorted
// alphabetically for easier human comparisons.
//
// USAGE:  node tfsort.js orig.json new.json
//
// Warning: Do not use the same filename for orig.json and new.json

const fs = require('fs');

// Get the filenames
const oldFilename = process.argv[2];
const newFilename = process.argv[3];

// Load the data for the original file
const data = fs.readFileSync(oldFilename, 'utf8');
const dict = JSON.parse(data);

const nspaces = (n) => ' '.repeat(n);

// Define the function to write out a sorted dictionary (recursively)
const writeSortedDict = function (f, d, indent) {
  const keys = Object.keys(d).sort();
  let maxKeyLen = 0;
  let key; let
    val;

  // Figure out the maximum key length
  keys.forEach((k) => {
    maxKeyLen = Math.max(k.length, maxKeyLen);
  });

  fs.writeSync(f, '{\n');
  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    val = d[key];
    if (typeof (val) === typeof ({})) {
      // Deal with sub-dictionaries
      fs.writeSync(f, `${indent}"${key}": `);
      writeSortedDict(f, val, `${indent}   `);
      if (i === keys.length - 1) {
        fs.writeSync(f, '\n');
      } else {
        fs.writeSync(f, ',\n');
      }
    } else {
      // Deal with simple string values
      val = val.replace(/"/g, '\'');
      fs.writeSync(f, `${indent}"${key}"${nspaces(maxKeyLen - key.length + 1)}: "${val}"`);
      if (i === keys.length - 1) {
        fs.writeSync(f, '\n');
      } else {
        fs.writeSync(f, ',\n');
      }
    }
  }
  fs.writeSync(f, `${indent}}`);
};

// Do the work of generating the new file
fs.open(newFilename, 'w', (err, f) => {
  if (err) { throw err; }

  // Write the new file and close it
  writeSortedDict(f, dict, '');
  fs.closeSync(f);

  // Reload the new file to test it
  const data2 = fs.readFileSync(newFilename, 'utf8');
  JSON.parse(data2);
});
