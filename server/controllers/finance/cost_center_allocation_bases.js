/**
* Cost Center Allocation Keys
*
* This controller exposes an API to the client for reading allocation keys
*/

const _ = require('lodash');
const db = require('../../lib/db');

async function fetch() {
  const queryCostCenterIndexesList = `
    SELECT
      cc.id, ccb.is_currency, ccb.decimal_places, ccb.units,
      ccb.name AS cost_center_allocation_basis_label,
      ccbv.quantity,
      cc.label AS cost_center_label,
      cc.step_order
    FROM cost_center cc
      JOIN cost_center_allocation_basis_value ccbv ON ccbv.cost_center_id = cc.id
      JOIN cost_center_allocation_basis ccb ON ccb.id = ccbv.basis_id
    ORDER BY cc.step_order ASC;
  `;
  const costCenterIndexesList = await db.exec(queryCostCenterIndexesList);

  const indexes = _.groupBy(costCenterIndexesList, 'cost_center_allocation_basis_label');

  const costCenterList = costCenterIndexesList
    .map(row => row.cost_center_label)
    .filter((row, index, array) => (array.indexOf(row) === index));

  const costCenterIndexes = Object.keys(indexes)
    .map((index) => {
      const ccIndex = _.sortBy(indexes[index], 'step_order');

      const [first] = indexes[index];
      const line = {
        index,
        distribution : [],
        units : first.units,
        is_currency : first.is_currency,
        decimal_places : first.decimal_places,
      };

      ccIndex.forEach((item) => {
        line.distribution.push({
          id : item.id,
          cost_center_label : item.cost_center_label,
          value : item.quantity,
        });
      });

      return line;
    });

  return { costCenterList, costCenterIndexes };
}

async function list(req, res) {
  const allocationKeys = await fetch();
  res.status(200).json(allocationKeys);
}

exports.fetch = fetch;
exports.list = list;
