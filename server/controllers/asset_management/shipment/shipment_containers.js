const db = require('../../../lib/db');
const FilterParser = require('../../../lib/filter');
const { uuid } = require('../../../lib/util');
const NotFound = require('../../../lib/errors/NotFound');

const containerSql = `
  SELECT
    BUID(sc.uuid) AS uuid, sc.label, BUID(sc.shipment_uuid) AS shipment_uuid,
    sc.weight, sc.container_type_id, sc.description,
    scType.text AS container_type
  FROM shipment_container AS sc
  JOIN shipment_container_types AS scType ON scType.id = sc.container_type_id
`;

function getFilters(parameters) {
  // clone the parameters
  const params = { ...parameters };

  db.convert(params, [
    'uuid',
    'shipment_uuid',
  ]);

  const filters = new FilterParser(params);

  filters.equals('uuid', 'uuid', 'sc');
  filters.equals('shipment_uuid', 'shipment_uuid', 'sc');

  return filters;
}

async function list(req, res, next) {
  try {
    const { params } = req;
    const filters = getFilters(params);
    filters.setOrder('ORDER BY sc.label');
    const query = filters.applyQuery(containerSql);
    const queryParameters = filters.parameters();
    const result = await db.exec(query, queryParameters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function containersForShipment(shipmentUuid) {
  const params = { shipment_uuid : shipmentUuid };
  const filters = getFilters(params);
  filters.setOrder('ORDER BY sc.label');
  const query = filters.applyQuery(containerSql);
  const queryParameters = filters.parameters();
  const result = await db.exec(query, queryParameters);
  return result;
}

async function details(req, res, next) {
  try {
    const { params } = req; // includes 'uuid'
    const filters = getFilters(params);
    const query = filters.applyQuery(containerSql);
    const queryParameters = filters.parameters();
    const result = await db.one(query, queryParameters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const params = req.body;
    const newUuid = params.uuid || uuid();
    const container = {
      uuid : db.bid(newUuid),
      label : params.label,
      description : params.description,
      container_type_id : params.container_type_id,
    };
    if (params.weight) {
      container.weight = params.weight;
    }
    if (params.shipment_uuid) {
      container.shipment_uuid = db.bid(params.shipment_uuid);
    }

    await db.exec('INSERT INTO shipment_container SET ?', container);

    res.status(201).json({ uuid : newUuid });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = req.params.uuid;

    const params = req.body;
    delete params.uuid;
    db.convert(params, ['shipment_uuid']);

    db.exec('UPDATE shipment_container SET ? WHERE uuid = ?', [params, db.bid(id)])
      .then(() => res.sendStatus(204))
      .catch(next);

  } catch (error) {
    next(error);
  }
}

async function deleteContainer(req, res, next) {
  try {
    const id = db.bid(req.params.uuid);

    // First reassign any shipment items current assigned to this container
    // (This may not result in any updates, so ignore the result)
    const rsql = 'UPDATE shipment_item SET container_uuid = NULL WHERE container_uuid = ?';
    await db.exec(rsql, [id]);

    // Then delete the container
    const delres = await db.exec('DELETE FROM shipment_container WHERE uuid = ?', [id]);

    // if nothing was deleted, let the client know via a 404 error
    if (delres.affectedRows === 0) {
      throw new NotFound(`Could not delete shipment container with uuid ${req.params.uuid}`);
    }

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

// ------------------------------------------------------------------
//
// shipment container types
//

async function listTypes(req, res, next) {
  try {
    const result = await db.exec('SELECT * from shipment_container_types');
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  details,
  containersForShipment,
  create,
  update,
  deleteContainer,
  listTypes,
};
