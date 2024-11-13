/**
 * The Location API
 *
 * routes:
 *   /locations/villages
 *   /locations/sectors
 *   /locations/provinces
 *   /locations/village/:uuid
 *   /locations/sector/:uuid
 *   /locations/province/:uuid
 *   /locations/detail/:uuid
 *
 * Each endpoint returns a table with all information available.
 * Endpoints taking UUIDs return only the records matching the UUID
 */

const { uuid } = require('../../lib/util');
const db = require('../../lib/db');

exports.lookupVillage = lookupVillage;

/**
 * GET /locations/villages
 *
 * This method lists all the villages from the database.
 *
 * Query Parameters:
 *  ?sector={uuid}
 *
 * @method villages
 * @return {Array} an array of (uuid, name)
 */
exports.villages = function villages(req, res, next) {
  let sql = '';
  if (req.query.detailed === '1') {
    sql = `
      SELECT BUID(v.uuid) as uuid, v.name, v.longitude, v.latitude,
        BUID(sector.uuid) AS sectorUuid, sector.name as sector_name,
        province.name AS province_name, BUID(province.uuid) AS provinceUuid, 
        country.name AS country_name,
        BUID(country.uuid) AS countryUuid
      FROM village v
        JOIN sector
        JOIN province JOIN country ON
        v.sector_uuid = sector.uuid AND
        sector.province_uuid = province.uuid AND
        province.country_uuid = country.uuid `;
  } else {
    sql = 'SELECT BUID(v.uuid) as uuid, v.name, v.longitude, v.latitude FROM village v ';
  }

  sql += (req.query.sector)
    ? 'WHERE v.sector_uuid = ? ORDER BY v.name ASC;'
    : 'ORDER BY v.name ASC;';

  if (req.query.sector) {
    req.query.sector = db.bid(req.query.sector);
  }

  db.exec(sql, [req.query.sector])
    .then((data) => {
      res.status(200).json(data);
    })
    .catch(next)
    
};

/**
 * GET /locations/sectors
 *
 * This method lists all the sectors in the database.
 *
 * Query Parameters:
 *  ?province={uuid}
 *
 * @method sectors
 * @return {Array} an array of (uuid, name)
 */
exports.sectors = function sectors(req, res, next) {
  let sql;

  // send a larger response if detailed is 1
  if (req.query.detailed === '1') {
    sql = `SELECT BUID(sector.uuid) as uuid, sector.name,
        province.name AS province_name, BUID(province.uuid) AS provinceUuid, country.name AS country_name,
        BUID(country.uuid) AS countryUuid
      FROM sector JOIN province JOIN country ON
        sector.province_uuid = province.uuid AND
        province.country_uuid = country.uuid`;
  } else {
    sql = 'SELECT BUID(sector.uuid) as uuid, sector.name FROM sector ';
  }


  sql += (req.query.province)
    ? ' WHERE sector.province_uuid = ? ORDER BY sector.name ASC;'
    : ' ORDER BY sector.name ASC;';

  if (req.query.province) {
    req.query.province = db.bid(req.query.province);
  }

  db.exec(sql, [req.query.province])
    .then((data) => {
      res.status(200).json(data);
    })
    .catch(next)
    
};

/**
 * GET /locations/provinces
 *
 * This method lists all the provinces in the database.
 *
 * Query Parameters:
 *  ?country={uuid}
 *
 * @method provinces
 * @return {Array} an array of (uuid, name)
 */
exports.provinces = function provinces(req, res, next) {
  let sql;

  // send a larger response if detailed is 1
  if (req.query.detailed === '1') {
    sql = `
      SELECT
        BUID(province.uuid) as uuid, province.name, country.name AS country_name,
        BUID(province.country_uuid) AS countryUuid
      FROM
        province
      JOIN
        country ON province.country_uuid = country.uuid`;
  } else {
    sql = `
      SELECT
        BUID(province.uuid) as uuid, province.name
      FROM province`;
  }


  sql += (req.query.country)
    ? ' WHERE province.country_uuid = ? ORDER BY province.name ASC;'
    : ' ORDER BY province.name ASC;';

  if (req.query.country) {
    req.query.country = db.bid(req.query.country);
  }

  db.exec(sql, [req.query.country])
    .then((data) => {
      res.status(200).json(data);
    })
    .catch(next)
    
};

/**
 * GET /locations/countries
 *
 * This method lists all the countries in the database.
 *
 * @method countries
 * @return {array} an array of (uuid, name)
 */
exports.countries = function countries(req, res, next) {
  const sql = `
    SELECT
      BUID(country.uuid) as uuid, country.name
    FROM
      country
    ORDER BY country.name ASC;`;

  db.exec(sql)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch(next)
    
};


function lookupVillage(uid) {
  // convert hex uuid into binary
  const bid = db.bid(uid);

  const sql = `
    SELECT BUID(village.uuid) as uuid, village.name, sector.name AS sector_name, BUID(sector.uuid) AS sector_uuid,
      province.name AS province_name, country.name AS country_name,
      village.longitude, village.latitude
    FROM village JOIN sector JOIN province JOIN country ON
      village.sector_uuid = sector.uuid AND
      sector.province_uuid = province.uuid AND
      province.country_uuid = country.uuid
    WHERE village.uuid = ?;`;

  return db.one(sql, [bid]);
}

function lookupSector(uid) {
  // convert hex to binary
  const bid = db.bid(uid);

  const sql = `SELECT BUID(sector.uuid) as uuid, sector.name,
      province.name AS province_name, country.name AS country_name
    FROM sector JOIN province JOIN country ON
      sector.province_uuid = province.uuid AND
      province.country_uuid = country.uuid
    WHERE sector.uuid = ?;`;

  return db.one(sql, [bid]);
}

function lookupProvince(uid) {
  const bid = db.bid(uid);

  const sql = `SELECT BUID(province.uuid) as uuid, province.name, country.name AS country_name
    FROM province JOIN country ON
      province.country_uuid = country.uuid
    WHERE province.uuid = ?;`;

  return db.one(sql, [bid]);
}

function lookupCountry(uid) {
  const bid = db.bid(uid);

  const sql = `SELECT BUID(country.uuid) as uuid, country.name
    FROM country
    WHERE country.uuid = ?;`;

  return db.one(sql, [bid]);
}

/**
 * GET /locations/detail/:uuid
 *
 * This method looks up a detailed location reference from the database and
 * returns it as a JSON object.
 *
 * @method detail
 * @return {object} JSON object with keys {villageUuid, village, sectorUuid,
 * sector, countryUuid, country}
 */
exports.detail = function detail(req, res, next) {
  const bid = db.bid(req.params.uuid);

  const sql = `SELECT BUID(village.uuid) AS villageUuid, village.name AS village, sector.name AS sector,
      BUID(sector.uuid) AS sectorUuid, province.name AS province, BUID(province.uuid) AS provinceUuid,
      country.name AS country, BUID(country.uuid) AS countryUuid,
      village.longitude, village.latitude
    FROM village, sector, province, country
    WHERE village.sector_uuid = sector.uuid AND
      sector.province_uuid = province.uuid AND
      province.country_uuid = country.uuid AND village.uuid = ?;`;

  db.one(sql, [bid])
    .then((row) => {
      res.status(200).json(row);
    })
    .catch(next)
    
};

/**
 * GET /locations/detail/
 *
 * This method looks up a detailed location reference from the database and
 * returns it as a JSON object.
 *
 * @method detail
 * @return {object} JSON object with keys {villageUuid, village, sectorUuid,
 * sector, countryUuid, country}
 */
exports.list = function list(req, res, next) {
  const sql = `SELECT BUID(village.uuid) AS villageUuid, village.name AS village, sector.name AS sector,
      BUID(sector.uuid) AS sectorUuid, province.name AS province, BUID(province.uuid) AS provinceUuid,
      country.name AS country, BUID(country.uuid) AS countryUuid,
      village.longitude, village.latitude
    FROM village, sector, province, country
    WHERE village.sector_uuid = sector.uuid AND
      sector.province_uuid = province.uuid AND
      province.country_uuid = country.uuid ;`;

  db.exec(sql)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch(next)
    
};


/** bindings for creation methods */
exports.create = {};

/**
 * POST /locations/country
 *
 * This method creates a country reference in the database and returns its uuid.
 *
 * @method createCountry
 * @returns {string} uuid - the unique id for the country.
 */
exports.create.country = function createCountry(req, res, next) {
  // create a UUID if not provided
  req.body.uuid = req.body.uuid || uuid();

  const sql = `INSERT INTO country (uuid, name) VALUES (?, ?);`;

  db.exec(sql, [db.bid(req.body.uuid), req.body.name])
    .then(() => {
      res.status(201).json({ uuid : req.body.uuid });
    })
    .catch(next)
    
};

/**
 * POST /locations/province
 *
 * This method creates a province reference, linked to a country, in the
 * database and returns its uuid.
 *
 * @method createProvince
 * @returns {string} uuid - the uuid for the province.
 */
exports.create.province = function createProvince(req, res, next) {
  const data = db.convert(req.body, [
    'village_uuid', 'sector_uuid', 'province_uuid', 'country_uuid',
  ]);

  // create a UUID if not provided
  data.uuid = data.uuid || uuid();

  const sql = 'INSERT INTO province (uuid, name, country_uuid) VALUES (?);';

  db.exec(sql, [[db.bid(data.uuid), data.name, data.country_uuid]])
    .then(() => {
      res.status(201).json({ uuid : data.uuid });
    })
    .catch(next)
    
};


/**
 * POST /locations/sector
 *
 * This method creates a sector reference, linked to a province, in the
 * database and returns its uuid.
 *
 * @method createSector
 * @returns {string} uuid - the unique id for the sector.
 */
exports.create.sector = function createSector(req, res, next) {
  const data = db.convert(req.body, ['province_uuid']);

  // create a UUID if not provided
  data.uuid = data.uuid || uuid();

  const sql = `INSERT INTO sector (uuid, name, province_uuid) VALUES (?);`;

  db.exec(sql, [[db.bid(data.uuid), data.name, data.province_uuid]])
    .then(() => {
      res.status(201).json({ uuid : data.uuid });
    })
    .catch(next)
    
};

/**
 * POST /locations/villages
 *
 * This method creates a village reference, linked to a sector, in the
 * database and returns its uuid.
 *
 * @method createVillage
 * @returns {string} uuid - the unique id for the village.
 */
exports.create.village = function createVillage(req, res, next) {
  const data = db.convert(req.body, ['sector_uuid']);

  // create a UUID if not provided
  data.uuid = data.uuid || uuid();

  const sql = `INSERT INTO village (uuid, name, sector_uuid, longitude, latitude) VALUES (?);`;

  db.exec(sql, [[db.bid(data.uuid), data.name, data.sector_uuid, data.longitude, data.latitude]])
    .then(() => {
      res.status(201).json({ uuid : data.uuid });
    })
    .catch(next)
    
};


/** bindings for update methods */
exports.update = {};

/**
 * PUT /locations/countries/:uuid
 *
 * This method update a country reference in the database.
 *
 * @method updateCountry
 */
exports.update.country = function updateCountry(req, res, next) {
  const bid = db.bid(req.params.uuid);
  const sql = 'UPDATE country SET ? WHERE uuid = ?;';

  // prevent updating the uuid
  delete req.body.uuid;

  const data = db.convert(req.body, [
    'village_uuid', 'sector_uuid', 'province_uuid', 'country_uuid',
  ]);

  db.exec(sql, [data, bid])
    .then(() => {
      return lookupCountry(req.params.uuid);
    })
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next)
    
};

/**
 * PUT /locations/provinces/:uuid
 *
 * This method Updates a province reference
 *
 * @method updateProvince
 */
exports.update.province = function updateProvince(req, res, next) {
  const bid = db.bid(req.params.uuid);
  const sql = 'UPDATE province SET ? WHERE uuid = ?;';

  // prevent updating the uuid
  delete req.body.uuid;

  const data = db.convert(req.body, [
    'village_uuid', 'sector_uuid', 'province_uuid', 'country_uuid',
  ]);

  db.exec(sql, [data, bid])
    .then(() => {
      return lookupProvince(req.params.uuid);
    })
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next)
    
};

/**
 * PUT /locations/sectors/:uuid
 *
 * This method Updates a sector reference, linked to a province, in the
 *
 * @method updateSector
 */
exports.update.sector = function updateSector(req, res, next) {
  const bid = db.bid(req.params.uuid);
  const sql = `UPDATE sector SET ? WHERE uuid = ?;`;

  // prevent updating the uuid
  delete req.body.uuid;

  const data = db.convert(req.body, [
    'village_uuid', 'sector_uuid', 'province_uuid', 'country_uuid',
  ]);

  db.exec(sql, [data, bid])
    .then(() => {
      return lookupSector(req.params.uuid);
    })
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next)
    
};

/**
 * PUT /locations/villages/:uuid
 *
 * This method updates a village reference, linked to a sector, in the
 *
 * @method updateVillage
 */
exports.update.village = function updateVillage(req, res, next) {
  const bid = db.bid(req.params.uuid);

  const sql = `UPDATE village SET ? WHERE uuid = ?;`;

  // prevent updating the uuid
  delete req.body.uuid;

  const data = db.convert(req.body, [
    'village_uuid', 'sector_uuid', 'province_uuid', 'country_uuid',
  ]);

  db.exec(sql, [data, bid])
    .then(() => {
      return lookupVillage(req.params.uuid);
    })
    .then((record) => {
      res.status(200).json(record);
    })
    .catch(next)
    
};

exports.delete = {};

exports.delete.country = (req, res, next) => {
  const sql = 'DELETE FROM country WHERE uuid=?';
  const _uuid = db.bid(req.params.uuid);
  db.exec(sql, _uuid).then(() => {
    res.sendStatus(204);
  }).catch(next);
};

exports.delete.province = (req, res, next) => {
  const sql = 'DELETE FROM province WHERE uuid=?';
  const _uuid = db.bid(req.params.uuid);
  db.exec(sql, _uuid).then(() => {
    res.sendStatus(204);
  }).catch(next);
};

exports.delete.sector = (req, res, next) => {
  const sql = 'DELETE FROM sector WHERE uuid=?';
  const _uuid = db.bid(req.params.uuid);
  db.exec(sql, _uuid).then(() => {
    res.sendStatus(204);
  }).catch(next);
};

exports.delete.village = (req, res, next) => {
  const sql = 'DELETE FROM village WHERE uuid=?';
  const _uuid = db.bid(req.params.uuid);
  db.exec(sql, _uuid).then(() => {
    res.sendStatus(204);
  }).catch(next);
};

exports.merge = (req, res, next) => {
  const { selected, other, locationStatus } = req.body;

  const transaction = db.transaction();

  if (locationStatus === 'country') {
    const replaceCountryInProvince = `
      UPDATE province SET country_uuid = ? WHERE country_uuid = ?;`;

    const removeOtherCountry = `
      DELETE FROM country WHERE uuid = ?;`;

    transaction
      .addQuery(replaceCountryInProvince, [db.bid(selected), db.bid(other)])
      .addQuery(removeOtherCountry, [db.bid(other)]);
  } else if (locationStatus === 'province') {

    const replaceProvinceInSector = `
      UPDATE sector SET province_uuid = ? WHERE province_uuid = ?;`;

    const removeOtherProvince = `
      DELETE FROM province WHERE uuid = ?;`;

    transaction
      .addQuery(replaceProvinceInSector, [db.bid(selected), db.bid(other)])
      .addQuery(removeOtherProvince, [db.bid(other)]);
  } else if (locationStatus === 'sector') {

    const replaceSectorInVillage = `
      UPDATE village SET sector_uuid = ? WHERE sector_uuid = ?;`;

    const removeOtherSector = `
      DELETE FROM sector WHERE uuid = ?;`;

    transaction
      .addQuery(replaceSectorInVillage, [db.bid(selected), db.bid(other)])
      .addQuery(removeOtherSector, [db.bid(other)]);
  } else if (locationStatus === 'village') {

    // debtor_group
    const replaceVillageInDebtorGroup = `
      UPDATE debtor_group SET location_id = ? WHERE location_id = ?;`;

    // enterprise
    const replaceVillageInEnterprise = `
      UPDATE enterprise SET location_id = ? WHERE location_id = ?;`;

    // Patient
    const replaceVillageInPatient1 = `
      UPDATE patient SET current_location_id = ? WHERE current_location_id = ?;`;

    const replaceVillageInPatient2 = `
      UPDATE patient SET origin_location_id = ? WHERE origin_location_id = ?;`;

    const removeOtherVillage = `
      DELETE FROM village WHERE uuid = ?;`;

    transaction
      .addQuery(replaceVillageInDebtorGroup, [db.bid(selected), db.bid(other)])
      .addQuery(replaceVillageInEnterprise, [db.bid(selected), db.bid(other)])
      .addQuery(replaceVillageInPatient1, [db.bid(selected), db.bid(other)])
      .addQuery(replaceVillageInPatient2, [db.bid(selected), db.bid(other)])
      .addQuery(removeOtherVillage, [db.bid(other)]);
  }

  transaction.execute().then(() => {
    res.sendStatus(200);
  }).catch(next);
};
