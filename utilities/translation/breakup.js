const fs = require('fs');
const sf = require('../../client/src/i18n/fr.json');

const properties = Object.keys(sf);

properties.forEach((property) => {
  const f = fs.openSync(`../../client/src/i18n/fr/${property.toLowerCase()}.json`, 'w');
  const obj = {};
  obj[property] = sf[property];
  const objAsString = JSON.stringify(obj);

  const res = objAsString.split(',').join(',\n');

  fs.writeFileSync(f, res, 'utf-8');
});
