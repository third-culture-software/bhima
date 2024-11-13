/**
* Depot Controller
*
* This controller is mostly responsible for depot-dependent stock queries.  Most
* routes require that a depot ID is specified.  Any route without a depot ID
* might be better positioned in the /inventory/ controller.
*
* @requires lodash
* @requires lib/util
* @requires lib/db
* @requires lib/errors
* @requires lib/filter
*/

const _ = require('lodash');
const router = require('express').Router();

const { uuid } = require('../../../lib/util');
const db = require('../../../lib/db');
const NotFound = require('../../../lib/errors/NotFound');
const BadRequest = require('../../../lib/errors/BadRequest');
const FilterParser = require('../../../lib/filter');

/** expose depots routes */
exports.list = list;
exports.detail = detail;
exports.create = create;
exports.update = update;
exports.remove = remove;
exports.getLotsInStockForDate = getLotsInStockForDate;
exports.searchByName = searchByName;

// router base is /depots
exports.router = router;

// attache the inventories router
const extra = require('./extra');

router.use('/:uuid', extra.router);

// set up these routes on the router.
router.get('/', list);
router.get('/:uuid', detail);
router.put('/:uuid', update);
router.post('/', create);
router.delete('/:uuid', remove);
router.get('/:depotUuid/inventories', getQuantitiesInStock);
router.get('/:depotUuid/stock', getLotsInStockForDateHttp);
router.get('/:depotUuid/flags/stock_out', getStockOuts);

router.get('/:depotUuid/management', getDepotManager);
router.get('/:depotUuid/supervision', getDepotSupervisor);

// special route for searching depot by name
router.get('/search/name', searchByName);

/**
 * @method getQuantitiesInStock
 *
 * @description
 * Returns the quantities in stock in the depot for a given date.  Includes
 * the quantities that are out of stock, if the inventory has previously been
 * used in the depot.
 */
async function getQuantitiesInStock(req, res, next) {
  const { depotUuid } = req.params;
  const { date, consumable, inStock } = req.query;

  function isConsumableFilter(row) {
    if (consumable === undefined) { return true; }
    return consumable === row.consumable;
  }

  function isInStockFilter(row) {
    if (inStock === undefined) { return true; }
    return inStock === (row.quantity > 0);
  }

  try {
    const sql = `
      SELECT sms.date, BUID(sms.inventory_uuid) AS uuid, sms.sum_quantity AS quantity,
        inventory.code, inventory.text, inventory.consumable
      FROM stock_movement_status AS sms JOIN (
        SELECT inside.inventory_uuid, MAX(inside.date) AS date
        FROM stock_movement_status AS inside
        WHERE inside.depot_uuid = ?
          AND inside.date <= DATE(?)
        GROUP BY inside.inventory_uuid
      ) AS outside
      ON outside.date = sms.date
        AND sms.inventory_uuid = outside.inventory_uuid
      JOIN inventory ON inventory.uuid = sms.inventory_uuid
      WHERE sms.depot_uuid = ?
      ORDER BY inventory.text;
    `;

    const params = [db.bid(depotUuid), new Date(date), db.bid(depotUuid)];
    const stock = await db.exec(sql, params);

    // TODO(@jniles) - it would be more efficient (but less readable) to do
    // this in SQL.  We should eventually move this into excel.
    const filtered = stock
      .filter(isConsumableFilter)
      .filter(isInStockFilter);

    res.status(200).json(filtered);
  } catch (err) {
    next(err);
  }
}

/**
 * @function getLotsInStockForDate
 *
 * @description
 * A higher-performance query to figure out the lots in a given depot.
 */
function getLotsInStockForDate(depotUuid, date) {

  // NOTE(@jniles) - doing the filtering on depot before the JOIN speeds
  // this query up by 3X.
  const sql = `
      SELECT
        BUID(inventory.uuid) AS inventory_uuid,
        BUID(lot.uuid) AS lot_uuid,
        balances.quantity,
        inventory.code,
        inventory.text,
        inventory.unit_weight,
        inventory.is_asset,
        inventory.is_count_per_container,
        BUID(inventory.group_uuid) AS group_uuid,
        lot.expiration_date,
        (lot.expiration_date < DATE(?)) AS is_expired,
        lot.label,
        lot.package_size,
        inventory_group.tracking_expiration,
        inventory_group.tracking_consumption,
        IF(ISNULL(inventory_unit.token), inventory_unit.text, CONCAT("INVENTORY.UNITS.",inventory_unit.token,".TEXT"))
          AS unit_type
      FROM (
        SELECT
          sm.lot_uuid,
          SUM(IF(sm.is_exit, -1 * sm.quantity, sm.quantity)) AS quantity
        FROM stock_movement AS sm
        WHERE sm.depot_uuid = ?
        GROUP BY sm.lot_uuid
        HAVING quantity > 0
      ) AS balances
      JOIN lot ON lot.uuid = balances.lot_uuid
      JOIN inventory ON lot.inventory_uuid = inventory.uuid
      JOIN inventory_group ON inventory.group_uuid = inventory_group.uuid
      JOIN inventory_unit ON inventory_unit.id = inventory.unit_id
      ORDER BY inventory.text, lot.expiration_date, lot.label;
    `;

  return db.exec(sql, [date, db.bid(depotUuid)]);
}

async function getLotsInStockForDateHttp(req, res, next) {
  const { depotUuid } = req.params;
  const { date } = req.query;

  try {
    const rows = await getLotsInStockForDate(depotUuid, date);
    res.status(200).json(rows);
  } catch (e) {
    next(e);
  }
}

/**
 * @method getStockOuts
 *
 * @description
 * Returns the articles that are out of stock at this time.
 */
async function getStockOuts(req, res, next) {
  const { depotUuid } = req.params;
  const { date } = req.query;

  try {
    const sql = `
      SELECT sms.date, BUID(sms.inventory_uuid) AS uuid,
        sms.sum_quantity AS quantity,
        inventory.code, inventory.text
      FROM stock_movement_status AS sms JOIN (
        SELECT inside.inventory_uuid, MAX(inside.date) AS date
        FROM stock_movement_status AS inside
        WHERE inside.depot_uuid = ?
          AND inside.date <= DATE(?)
        GROUP BY inside.inventory_uuid
      ) AS outside
      ON outside.date = sms.date
        AND sms.depot_uuid = ?
        AND sms.inventory_uuid = outside.inventory_uuid
      JOIN inventory ON inventory.uuid = sms.inventory_uuid
      WHERE sms.sum_quantity = 0
      ORDER BY inventory.text;
    `;

    const params = [db.bid(depotUuid), new Date(date), db.bid(depotUuid)];
    const stock = await db.exec(sql, params);
    res.status(200).json(stock);
  } catch (err) {
    next(err);
  }
}

/**
* POST /depots
* Create a new depot in the database
*
* @function create
*/
async function create(req, res, next) {
  const query = 'INSERT INTO depot SET ?';

  // prevent missing uuid by generating a new one
  const depotUuid = req.body.uuid || uuid();
  req.body.uuid = db.bid(depotUuid);

  if (req.body.parent_uuid === 0) {
    req.body.parent_uuid = null;
  } else {
    req.body.parent_uuid = db.bid(req.body.parent_uuid);
  }

  // convert the location uuid into binary
  req.body = db.convert(req.body, ['location_uuid', 'allowed_distribution_depots']);

  // enterprise for the depot
  req.body.enterprise_id = req.session.enterprise.id;

  let allowedDistributionDepots;
  if (req.body.allowed_distribution_depots) {
    allowedDistributionDepots = req.body.allowed_distribution_depots;
    delete req.body.allowed_distribution_depots;
  }

  try {
    const tx = db.transaction();
    tx.addQuery(query, [req.body]);
    const enabledAndDistributionDepotsDefined = req.session.stock_settings.enable_strict_depot_distribution
      && allowedDistributionDepots.length;
    if (enabledAndDistributionDepotsDefined) {
      allowedDistributionDepots.forEach(item => {
        tx.addQuery('INSERT INTO depot_distribution_permission VALUES (?, ?);', [req.body.uuid, item]);
      });
    }
    await tx.execute();
    res.status(201).json({ uuid : depotUuid });
  } catch (error) {
    next(error);
  }
}

/**
* DELETE /depots
* delete an existing depot in the database
*
* @function remove
*/
async function remove(req, res, next) {
  try {
    const uid = db.bid(req.params.uuid);
    const tx = db.transaction();
    tx.addQuery('DELETE FROM depot_distribution_permission WHERE depot_uuid = ?', [uid]);
    tx.addQuery('DELETE FROM depot_distribution_permission WHERE distribution_depot_uuid = ?', [uid]);
    tx.addQuery('DELETE FROM depot WHERE uuid = ?', [uid]);
    await tx.execute();
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

/**
* PUT /depots
* Edit an existing depot in the database
*
* @function update
*/
async function update(req, res, next) {
  let allowedDistributionDepots;
  const tx = db.transaction();
  const uid = db.bid(req.params.uuid);

  if (req.body.parent_uuid === 0) {
    req.body.parent_uuid = null;
  } else {
    req.body.parent_uuid = db.bid(req.body.parent_uuid);
  }

  // prevent updating the uuid by accident
  if (req.body.uuid) { delete req.body.uuid; }

  // delete property children
  if (req.body.children) { delete req.body.children; }

  // convert the location uuid into binary
  req.body = db.convert(req.body, ['location_uuid', 'allowed_distribution_depots']);

  // get distribution depots and delete the variable from query param
  if (req.body.allowed_distribution_depots) {
    allowedDistributionDepots = req.body.allowed_distribution_depots || [];
    delete req.body.allowed_distribution_depots;
  }

  // delete variable from query param
  if (req.body.distribution_depots) {
    delete req.body.distribution_depots;
  }

  try {
    const enabledAndDistributionDepotsDefined = req.session.stock_settings.enable_strict_depot_distribution;

    if (enabledAndDistributionDepotsDefined) {
      tx.addQuery('DELETE FROM depot_distribution_permission WHERE depot_uuid = ?;', [uid]);
      allowedDistributionDepots.forEach(item => {
        tx.addQuery('INSERT INTO depot_distribution_permission VALUES (?, ?);', [uid, item]);
      });
    }

    tx.addQuery('UPDATE depot SET ? WHERE uuid = ?', [req.body, uid]);

    await tx.execute();

    const sql = `
      SELECT BUID(uuid) as uuid, text, description, enterprise_id, is_warehouse,
        allow_entry_purchase, allow_entry_donation, allow_entry_integration, allow_entry_transfer,
        allow_exit_debtor, allow_exit_service, allow_exit_transfer, allow_exit_loss,
        min_months_security_stock, IF(parent_uuid IS NULL, 0, BUID(parent_uuid)) as parent_uuid,
        dhis2_uid, default_purchase_interval, is_count_per_container
      FROM depot WHERE uuid = ?`;
    const rows = await db.exec(sql, [uid]);

    if (!rows.length) {
      throw new NotFound(`Could not find a depot with uuid ${req.params.uuid}`);
    }

    const distributionQuery = `
      SELECT BUID(ddp.distribution_depot_uuid) as uuid, d.text FROM depot_distribution_permission ddp
      LEFT JOIN depot d ON d.uuid = ddp.distribution_depot_uuid
      WHERE ddp.depot_uuid = ?;
    `;
    const distribution = await db.exec(distributionQuery, [uid]);
    rows[0].allowed_distribution_depots = distribution.map(item => item.uuid);
    res.status(200).send(rows);
  } catch (error) {
    next(error);
  }
}

/**
* GET /depots
* Fetches all depots in the database
*
* @function list
*/
function list(req, res, next) {
  const options = db.convert(req.query, ['uuid', 'uuids', 'exception']);

  if (options.only_user) {
    options.user_id = req.session.user.id;
  }

  // For Depot managers and supervisors
  if (req.query.only_management_supervision && req.session.stock_settings.enable_strict_depot_permission) {
    options.user_management_id = req.session.user.id;
  }

  // When the enable_strict_depot_distribution option is activated, you can only make
  // a requisition request if the supplier depot is configured to distribute to the beneficiary depot
  if (req.query.only_distributor && req.session.stock_settings.enable_strict_depot_distribution) {
    options.only_distributor_for = req.query.exception;
  }

  // When the enable_strict_depot_distribution option is activated,
  // you could only distribute to depots configured for distribution
  if (req.query.only_depot_allowed_distribution && req.session.stock_settings.enable_strict_depot_distribution) {
    options.only_depot_allowed_distribution = req.query.exception;
  }

  options.enterprise_id = req.session.enterprise.id;

  const filters = new FilterParser(options, { tableAlias : 'd' });

  const sql = `
    SELECT
      BUID(d.uuid) as uuid, d.text, d.description, d.is_warehouse,
      GROUP_CONCAT(DISTINCT u.display_name ORDER BY u.display_name DESC SEPARATOR ', ') AS users,
      GROUP_CONCAT(DISTINCT uu.display_name ORDER BY uu.display_name DESC SEPARATOR ', ') AS supervisors,
      d.allow_entry_purchase, d.allow_entry_donation, d.allow_entry_integration,
      d.allow_entry_transfer, d.allow_exit_debtor, d.allow_exit_service,
      d.allow_exit_transfer, d.allow_exit_loss, BUID(d.location_uuid) AS location_uuid,
      d.min_months_security_stock, d.default_purchase_interval, d.is_count_per_container,
      IFNULL(BUID(d.parent_uuid), 0) as parent_uuid, d.dhis2_uid, v.name as village_name,
      s.name as sector_name, p.name as province_name, c.name as country_name
    FROM depot d
      LEFT JOIN village v ON v.uuid = d.location_uuid
      LEFT JOIN sector s ON s.uuid = v.sector_uuid
      LEFT JOIN province p ON p.uuid = s.province_uuid
      LEFT JOIN country c ON c.uuid = p.country_uuid
      LEFT JOIN depot_permission dp  ON dp.depot_uuid = d.uuid
      LEFT JOIN depot_supervision ds ON ds.depot_uuid = d.uuid
      LEFT JOIN user u ON u.id = dp.user_id
      LEFT JOIN user uu ON uu.id = ds.user_id
  `;

  filters.custom(
    'user_id',
    'd.uuid IN (SELECT depot_permission.depot_uuid FROM depot_permission WHERE depot_permission.user_id = ?)',
  );

  filters.custom(
    'user_management_id',
    `d.uuid IN (
      SELECT DISTINCT d.depot_uuid
        FROM (
          SELECT dp.depot_uuid, dp.user_id
          FROM depot_permission AS dp
          UNION
          SELECT ds.depot_uuid, ds.user_id
          FROM depot_supervision AS ds
        ) AS d
      WHERE d.user_id = ?
    )`,
  );

  filters.custom('exception', 'd.uuid NOT IN (?)');
  filters.fullText('text', 'text', 'd');
  filters.equals('is_warehouse', 'is_warehouse', 'd');
  filters.equals('is_count_per_container', 'is_count_per_container', 'd');
  filters.equals('uuid', 'uuid', 'd');
  hasUuids(options.uuids, filters);
  filters.equals('enterprise_id', 'enterprise_id', 'd');
  filters.setOrder('ORDER BY d.text');
  filters.setGroup('GROUP BY d.uuid');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  db.exec(query, parameters)
    .then(rows => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

function hasUuids(uuids, filters) {
  if (!uuids) return;
  const n = [].concat(uuids).length;
  let qs = '';
  for (let i = 0; i < n; i++) {
    qs = (i === (n - 1)) ? `${qs}?` : qs = `${qs}?,`;
  }
  filters.custom('uuids', `d.uuid IN (${qs})`);
}
/*
 * @method searchByName
 *
 * @description
 * This method implements a depot search that will only return very limited information
 */
function searchByName(req, res, next) {
  const options = {};
  options.text = req.query.text;

  // if only_user is defined, we search only on the user identity.
  if (req.query.only_user) {
    options.user_id = req.session.user.id;
  }

  // For Depot managers and supervisors
  if (req.query.only_management_supervision && req.session.stock_settings.enable_strict_depot_permission) {
    options.user_management_id = req.session.user.id;
  }

  // When the enable_strict_depot_distribution option is activated, you can only make
  // a requisition request if the supplier depot is configured to distribute to the beneficiary depot
  if (req.query.only_distributor && req.session.stock_settings.enable_strict_depot_distribution) {
    options.only_distributor_for = req.query.exception;
  }

  // When the enable_strict_depot_distribution option is activated,
  // you could only distribute to depots configured for distribution
  if (req.query.only_depot_allowed_distribution && req.session.stock_settings.enable_strict_depot_distribution) {
    options.only_depot_allowed_distribution = req.query.exception;
  }

  options.exception = req.query.exception;
  options.limit = req.query.limit || 10;
  options.enterprise_id = req.session.enterprise.id;

  if (_.isUndefined(options.text)) {
    return next(new BadRequest('text attribute must be specified for a name search'));
  }

  db.convert(options, ['exception', 'only_distributor_for', 'only_depot_allowed_distribution']);

  const filters = new FilterParser(options, { tableAlias : 'd' });

  const sql = `
    SELECT
      BUID(d.uuid) as uuid, d.text, d.description, d.is_warehouse,
      d.allow_entry_purchase, d.allow_entry_donation, d.allow_entry_integration,
      d.allow_entry_transfer, d.allow_exit_debtor, d.allow_exit_service,
      d.allow_exit_transfer, d.allow_exit_loss, BUID(d.location_uuid) AS location_uuid,
      IF(parent_uuid, BUID(parent_uuid), 0) as parent_uuid, d.dhis2_uid, d.is_count_per_container,
      d.default_purchase_interval, v.name as village_name, s.name as sector_name,
      p.name as province_name, c.name as country_name
    FROM depot d
      LEFT JOIN village v ON v.uuid = d.location_uuid
      LEFT JOIN sector s ON s.uuid = v.sector_uuid
      LEFT JOIN province p ON p.uuid = s.province_uuid
      LEFT JOIN country c ON c.uuid = p.country_uuid
  `;

  filters.custom('exception', 'd.uuid NOT IN (?)');

  filters.custom(
    'user_id',
    'd.uuid IN (SELECT depot_permission.depot_uuid FROM depot_permission WHERE depot_permission.user_id = ?)',
  );

  filters.custom(
    'only_distributor_for',
    'd.uuid IN (SELECT dp.depot_uuid FROM depot_distribution_permission AS dp WHERE dp.distribution_depot_uuid = ?)',
  );

  filters.custom(
    'only_depot_allowed_distribution',
    'd.uuid IN (SELECT dp.distribution_depot_uuid FROM depot_distribution_permission AS dp WHERE dp.depot_uuid = ?)',
  );

  filters.custom(
    'user_management_id',
    `d.uuid IN (
      SELECT DISTINCT d.depot_uuid
        FROM (
          SELECT dp.depot_uuid, dp.user_id
          FROM depot_permission AS dp
          UNION
          SELECT ds.depot_uuid, ds.user_id
          FROM depot_supervision AS ds
        ) AS d
      WHERE d.user_id = ?
    )`,
  );

  filters.fullText('text', 'text', 'd');
  filters.equals('enterprise_id', 'enterprise_id', 'd');
  filters.setOrder('ORDER BY d.text');

  const query = filters.applyQuery(sql);
  const parameters = filters.parameters();

  return db.exec(query, parameters)
    .then((results) => res.send(results))
    .catch(next)
    
}

/**
* GET /depots/:uuid
* Fetches a depot by its uuid from the database
*
* @function detail
*/
async function detail(req, res, next) {
  const options = req.query;

  const uid = db.bid(req.params.uuid);

  const sql = `
    SELECT
      BUID(d.uuid) as uuid, d.text, d.description, d.is_warehouse, BUID(d.location_uuid) AS location_uuid,
      allow_entry_purchase, allow_entry_donation, allow_entry_integration, allow_entry_transfer,
      allow_exit_debtor, allow_exit_service, allow_exit_transfer, allow_exit_loss,
      BUID(parent_uuid) parent_uuid, dhis2_uid,
      min_months_security_stock, default_purchase_interval, is_count_per_container
    FROM depot AS d
    WHERE d.enterprise_id = ? AND d.uuid = ? `;

  const requireUserPermissions = ` AND
    d.uuid IN (SELECT depot_permission.depot_uuid FROM depot_permission WHERE depot_permission.user_id = ?)
  `;

  const query = options.only_user ? sql.concat(requireUserPermissions) : sql;

  try {
    const row = await db.one(query, [req.session.enterprise.id, uid, req.session.user.id]);

    const distributionQuery = `
      SELECT BUID(ddp.distribution_depot_uuid) as uuid, d.text FROM depot_distribution_permission ddp
      LEFT JOIN depot d ON d.uuid = ddp.distribution_depot_uuid
      WHERE ddp.depot_uuid = ?;
    `;
    const distribution = await db.exec(distributionQuery, [uid]);
    row.allowed_distribution_depots = distribution.map(item => item.uuid);
    row.distribution_depots = distribution;

    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
}

/**
* GET /depots/:uuid/management
* Fetches a user manager of depot by its uuid from the database
*
* @function getDepotManager
*/
async function getDepotManager(req, res, next) {
  const uid = db.bid(req.params.depotUuid);

  const sql = `
    SELECT dp.user_id, u.username AS 'Utilisateur'
    FROM depot_permission AS dp
    JOIN user AS u ON u.id = dp.user_id
    WHERE dp.depot_uuid = ?;
  `;

  db.exec(sql, [uid])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}

/**
* GET /depots/:uuid/supervision
* Fetches a user manager of depot by its uuid from the database
*
* @function getDepotSupervisor
*/
async function getDepotSupervisor(req, res, next) {
  const uid = db.bid(req.params.depotUuid);

  const sql = `
    SELECT ds.user_id, u.username AS 'Utilisateur'
    FROM depot_supervision AS ds
    JOIN user AS u ON u.id = ds.user_id
    WHERE ds.depot_uuid = ?;
  `;

  db.exec(sql, [uid])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch(next)
    
}
