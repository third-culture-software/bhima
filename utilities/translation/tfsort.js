// Rewrite the translation file producing a 'new.json' file that is sorted
// alphabetically for easier human comparisons.
//
// USAGE:  node tfsort.js orig.json new.json
//
// Warning: Do not use the same filename for orig.json and new.json

const fs = require('node:fs');

// Get the filenames from command line arguments
const [,, oldFilename, newFilename] = process.argv;

if (!oldFilename || !newFilename) {
  console.error('Usage: node tfsort.js orig.json new.json');
  process.exit(1);
}

// Load the data for the original file
const data = fs.readFileSync(oldFilename, 'utf8');
const dict = JSON.parse(data);

/**
 * Recursively generates a formatted, sorted JSON string.
 * @param {object} obj - The object to format
 * @param {string} indent - The current indentation string
 * @returns {string} - The formatted JSON string
 */
const generateSortedJson = (obj, indent = '') => {
  const keys = Object.keys(obj).sort();
  
  const maxKeyLen = keys.length > 0 ? Math.max(...keys.map(k => k.length)) : 0;

  let result = '{\n';

  keys.forEach((key, i) => {
    const val = obj[key];
    const isLast = i === keys.length - 1;
    const padding = ' '.repeat(maxKeyLen - key.length + 1);
    
    // Check if value is a nested object (not null and not an array)
    const isNestedObject = typeof val === 'object' && val !== null && !Array.isArray(val);

    if (isNestedObject) {
      // Recursively call and build the string
      result += `${indent}"${key}"${padding}: \n${generateSortedJson(val, indent + '   ')}`;
      if (!isLast) result += ',\n';
    } else {
      // Replace double quotes with single quotes in values as per original script
      const formattedVal = String(val).replace(/"/g, '\'');
      result += `${indent}"${key}"${padding}: "${formattedVal}"${isLast ? '\n' : ',\n'}`;
    }
  });

  result += `${indent}}`;
  return result;
};

try {
  // Generate the formatted string
  const output = generateSortedJson(dict);
  
  // Write to the new file synchronously
  fs.writeFileSync(newFilename, output, 'utf-8');
  console.log(`Success: Sorted translation saved to ${newFilename}`);
} catch (err) {
  console.error(`Error processing files: ${err.message}`);
  process.exit(1);
}

