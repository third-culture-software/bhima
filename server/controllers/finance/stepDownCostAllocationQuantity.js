const db = require('../../lib/db');
const FilterParser = require('../../lib/filter');
const constants = require('../../config/constants');

module.exports = {
  create,
  list,
  update,
  delete : remove,
  bulkDetails,
  bulkCreate,
  bulkDelete,
  bulkUpdate,
  updateQuantities,
};

// get details of all allocation base quantities for a given cost center
//
// GET /cost_center_allocation_basis_quantity/bulk/:id
//
async function bulkDetails(req, res) {
  const sql = `
    SELECT
      abv.id, abv.quantity, abv.cost_center_id, abv.basis_id,
      cc.label AS cost_center_label, ab.name AS allocation_basis_label, ab.units AS allocation_basis_units
    FROM cost_center_allocation_basis_value abv
    JOIN cost_center cc ON cc.id = abv.cost_center_id
    JOIN cost_center_allocation_basis ab ON ab.id = abv.basis_id
    WHERE cc.id = ?
  `;
  const data = await db.exec(sql, [+req.params.id]);
  res.status(200).json(data);
}

// add multiple new allocation basis quantity
//
// POST /cost_center_allocation_basis_quantity/bulk
//
async function bulkCreate(req, res) {
  const data = req.body.params;
  const sql = `INSERT INTO cost_center_allocation_basis_value SET ?`;
  const tx = db.transaction();

  data.forEach(item => {
    tx.addQuery(sql, item);
  });

  await tx.execute();
  res.sendStatus(201);

}

// update multiple allocation basis quantity
//
// PUT /cost_center_allocation_basis_quantity/bulk
//
async function bulkUpdate(req, res) {
  const ccId = req.params.id;
  const data = req.body.params;
  const sql = `INSERT INTO cost_center_allocation_basis_value SET ?`;
  const tx = db.transaction();

  tx.addQuery('DELETE FROM cost_center_allocation_basis_value WHERE cost_center_id = ?;', [ccId]);

  data.forEach(item => {
    tx.addQuery(sql, { cost_center_id : ccId, ...item });
  });

  await tx.execute();
  res.sendStatus(201);

}

// remove multiple new allocation basis quantity
//
// DELETE /cost_center_allocation_basis_quantity/bulk
//
async function bulkDelete(req, res) {
  const ccId = req.params.id;
  const sql = `DELETE FROM cost_center_allocation_basis_value WHERE cost_center_id = ?`;

  await db.exec(sql, [ccId]);
  res.sendStatus(203);
}

// get details of all allocation base quantities
//
// GET /cost_center_allocation_basis_quantity
//   Uses two optional parameters:  basis_id, cost_center_id
//
async function list(req, res) {
  const sql = `
    SELECT
      abv.id, abv.quantity, abv.cost_center_id, abv.basis_id,
      cc.label AS cost_center_label, ab.name AS allocation_basis_label, ab.units AS allocation_basis_units
    FROM cost_center_allocation_basis_value abv
    JOIN cost_center cc ON cc.id = abv.cost_center_id
    JOIN cost_center_allocation_basis ab ON ab.id = abv.basis_id
  `;
  const filters = new FilterParser(req.query);
  filters.equals('id', 'id', 'abv');
  filters.equals('basis_id', 'basis_id', 'abv');
  filters.equals('cost_center_id', 'cost_center_id', 'abv');
  const query = filters.applyQuery(sql);
  const params = filters.parameters();

  const rows = await db.exec(query, params);
  res.status(200).json(rows);
}

// add a new allocation basis quantity
//
// POST /cost_center_allocation_basis_quantity
//
async function create(req, res) {
  const sql = `INSERT INTO cost_center_allocation_basis_value SET ?`;
  const data = req.body;
  await db.exec(sql, data);
  res.sendStatus(201);
}

// update allocation basis quantity details
//
// PUT /cost_center_allocation_basis_quantity/:id
//
async function update(req, res) {
  const sql = 'UPDATE cost_center_allocation_basis_value SET ?  WHERE id = ?';
  const data = req.body;
  await db.exec(sql, [data, req.params.id]);
  res.sendStatus(200);
}

// Delete a allocation basis quantity
//
// DELETE /cost_center_allocation_basis_quantity/:id
//
async function remove(req, res) {
  const sql = 'DELETE FROM cost_center_allocation_basis_value WHERE id = ?';
  await db.exec(sql, req.params.id);
  res.sendStatus(204);
}

// Update computable allocation basis quantities
//
// UPDATE /cost_center_allocation_basis_quantities_update
//
async function updateQuantities(req, res) {
  // Get the full list of cost center IDs
  const costCentersQuery = 'SELECT id, label AS name from cost_center';
  const costCenters = await db.exec(costCentersQuery);

  // Get the allocation bases that are computable
  const cabQuery = 'SELECT id, name FROM cost_center_allocation_basis WHERE is_computed = 1';
  const computables = await db.exec(cabQuery);

  // Queries to update the quantity records
  const delQRec = 'DELETE FROM `cost_center_allocation_basis_value` '
      + 'WHERE `cost_center_id` = ? AND `basis_id` = ?';
  const insertQRec = 'INSERT INTO `cost_center_allocation_basis_value` '
      + '(`cost_center_id`, `basis_id`, `quantity`) VALUES (?, ?, ?)';

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < computables.length; i++) {
    const transaction = db.transaction();
    const basis = computables[i];
    const data = await computedAllocationQuantities(basis.id);

    // Update quantities for each cost center
    for (let k = 0; k < costCenters.length; k++) {
      const cc = costCenters[k];
      // Get the data for this cost center (if any)
      const ccData = data.find(item => item.cost_center_id === cc.id);
      const newQuantity = ccData ? ccData[basis.name] : 0;

      // First delete the old record first
      transaction.addQuery(delQRec, [cc.id, basis.id]);
      // The add a new entry for the updated quantity
      transaction.addQuery(insertQRec, [cc.id, basis.id, newQuantity]);
    }

    await transaction.execute();
  }

  // Success!
  res.sendStatus(200);
}

/**
 * Get cost allocation basis quantities
 *
 * This function returns a set of values for the specified
 * allocation_basis_id for each cost center.
 *
 * @param {Number} allocation_basis_id
 */
function computedAllocationQuantities(allocationBasisId) {
  let query = null;
  if (allocationBasisId === constants.allocationBasis.ALLOCATION_BASIS_NUM_EMPLOYEES) {
    // Set up the query for number of employees
    query = `
      SELECT BUID(service.uuid) AS service_uuid, service.name AS service_name,
        COUNT(employee.uuid) AS ALLOCATION_BASIS_NUM_EMPLOYEES,
        GetCostCenterByServiceUuid(service.uuid) as cost_center_id
      FROM service JOIN employee ON service.uuid = employee.service_uuid
      GROUP BY service.uuid;
  `;
  } else {
    return [];
  }
  return db.exec(query);
}
