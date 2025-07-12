/**
* Cost Center Allocation Keys
*
* This controller exposes an API to the client for reading allocation keys
*/
// const _ = require('lodash');
const db = require('../../lib/db');
const stepdown = require('../../lib/stepdown');
const fiscal = require('./fiscal');
const ccAllocationKeys = require('./cost_center_allocation_bases');
const Exchange = require('./exchange');

async function fetch(session, params) {
  const enterpriseId = session.enterprise.id;

  const periods = {
    periodFrom : params.periodFrom,
    periodTo : params.periodTo,
  };

  const range = await fiscal.getDateRangeFromPeriods(periods);
  const exchangeRate = await Exchange.getExchangeRate(enterpriseId, params.currency_id, range.dateTo);

  const query = 'CALL ComputeCostCenterAllocationByIndex(?, ?, ?, ?);';
  let [costCenters] = await db.exec(query, [
    range.dateFrom,
    range.dateTo,
    params.include_revenue,
    params.currency_id,
  ]);

  if (costCenters.length) {
    const [single] = costCenters;
    costCenters = single.error_message ? [] : costCenters;
  }

  const formattedCostCenters = costCenters.map(item => {
    item.principal = !!item.is_principal;
    item.auxiliary = !item.principal;
    item.directCost = item.direct_cost;
    if (item.allocation_basis_id && !item.principal) {
      item.allocation = { method : 'proportional', field : item.allocation_basis_id };
    }
    return item;
  });

  const data = stepdown.compute(formattedCostCenters);

  const cumulatedAllocatedCosts = data
    .map((item, index, array) => (item.principal ? 'principal' : array[index].toDist[index]))
    .filter(item => item !== 'principal');

  const auxiliaryIndexes = data.map((item, i) => (item.auxiliary ? i : null)).filter(item => !!item);
  const services = data.map(item => {
    item.distribution = item.toDist.map((value, i) => {
      const ratio = item.ratio ? item.ratio[i] : undefined;
      return { value, ratio };
    });

    item.auxiliaryDistribution = item.distribution.map((value, i) => {
      return auxiliaryIndexes.includes(i) ? value : null;
    }).filter(value => !!value);

    return item;
  });

  const directCostTotal = services.reduce((prev, curr) => { return curr.directCost + prev; }, 0);

  // horizontal view
  const hView = [];
  let totalAfterAllocation = 0;

  // heck to get the correct number of columns
  const numAuxiliaryCenters = data.filter(value => !value.is_principal).length;

  for (let i = 0; i < data.length; i++) {
    const ei = data[i];
    const row = {
      name : ei.cost_center_label,
      principal : ei.principal,
      auxiliary : ei.auxiliary,
      direct : ei.directCost,
      allocation_basis : ei.allocation_basis_id,
      values : [],
      total : 0,
    };

    for (let z = 0; z < numAuxiliaryCenters; z++) {
      const value = data[z].toDist[i];
      const ratio = data[z].ratio ? data[z].ratio[i] : 0;
      const selfCenter = !!(i === z);
      const selfCenterValue = selfCenter ? value * -1 : null;
      row.total += i !== z ? value : 0;
      row.values.push({
        value,
        ratio,
        selfCenter,
        selfCenterValue,
      });
    }

    // the total is the direct cost plus all allocations
    row.total += ei.directCost;
    // auxiliary cost center distribute all of their value
    row.total = ei.auxiliary ? 0 : row.total;
    // the total after all allocation (this value must be equal to the sum of all direct cost)
    totalAfterAllocation += row.total;
    hView.push(row);
  }

  // cost center allocation keys details
  const { costCenterList, costCenterIndexes } = await ccAllocationKeys.fetch();

  // Transpose the allocation columns
  const allocationColumns = costCenterIndexes.map(item => item.index);
  const allocationRows = costCenterList.map((cName, idx) => {
    return {
      centerName : cName,
      allocationValues : costCenterIndexes.map(item => (item.distribution ? item.distribution[idx].value : null)),
    };
  });

  return {
    dateFromMonth : range.dateFrom,
    dateToMonth : range.dateTo,
    rate : exchangeRate.rate,
    currencyId : Number(params.currency_id),
    showAllocationsTable : Number(params.show_allocations_table),
    data,
    cumulatedAllocatedCosts,
    allocationColumns,
    allocationRows,
    directCostTotal,
    totalAfterAllocation,
    hView,
  };
}

async function list(req, res) {
  const allocationRegistry = await fetch(req.session, req.query);
  res.status(200).json(allocationRegistry);
}

exports.fetch = fetch;
exports.list = list;
