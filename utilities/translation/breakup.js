const fs = require('node:fs');
const path = require('node:path');
const sf = require('../../client/src/i18n/fr.json');

const outputDir = path.resolve(__dirname, '../../client/src/i18n/fr');

Object.keys(sf).forEach((property) => {
  const filePath = path.join(outputDir, `${property.toLowerCase()}.json`);
  const obj = { [property]: sf[property] };
  const content = JSON.stringify(obj, null, 2);
  fs.writeFileSync(filePath, content, 'utf-8');
});
