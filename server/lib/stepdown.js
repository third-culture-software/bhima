/**
 *
 * @param method
 * @param contributions
 */
function computeRatios(method, contributions) {
  if (method === 'proportional') {
    const sum = contributions.reduce((csum, r) => { return csum + r; }, 0);
    return contributions.map(r => { return r / sum; });
  }
  // TODO: Implement for 'flat' allocation
  return null;
}

/**
 * @function compute
 * @param {Array} services an array of services object
 * @description perform the step down method on the given array of services (cost centers)
 * Here is the structure of the array of object
 * [
 *  {
 *    name: 'Daycare',        // (required) the name of the cost center
 *    principal: false,       // (required) the cost center is principal or auxiliary
 *    directCost : 50000,     // (required) direct cost
 *    employees : 5,          // example of cost center index value to track in case of allocation
 *    computers : 2,          // example of cost center index value to track in case of allocation
 *    allocation : { method : 'proportional', field : 'employees' }, // the allocation method and field
 *  }
 * ]
 * @returns {Array}
 */
function compute(services) {
  const Ncenters = services.length;

  // Do the step-down procedure to allocate costs
  services.forEach((serv, iStep) => {
    serv.total = serv.directCost;

    serv.toDist = Array(Ncenters).fill(0);
    serv.toDist[iStep] = serv.directCost;

    if (!serv.principal) {
    // Compute the ratios for this step
      const { method, field } = serv.allocation;

      // Get the values controlling the allocation
      const vals = services.map(serv2 => { return serv2[field]; });

      // Compute the ratios (left-fill with zeros)
      const ratios = Array(iStep + 1).fill(0).concat(computeRatios(method, vals.slice(iStep + 1)));
      serv.ratio = ratios;

      // Compute the distributions for each auxiliary center
      for (let j = 0; j < Ncenters; j++) {
      // Compute the distributions of this center for succeeding centers
        serv.toDist[j] += serv.toDist[iStep] * serv.ratio[j];
        if (iStep > 0) {
          if (j <= iStep) {
          // Add in the allocations from previous steps
            for (let k = 0; k < iStep; k++) {
              serv.toDist[j] += services[k].toDist[j];
            }
          }
          if (j < iStep) {
            serv.toDist[j] = 0;
          }
        }
      }

    } else {

      // do final distributions to principal revenue centers
      for (let j = 0; j < iStep; j++) {
        serv.total += services[j].toDist[iStep];
      }
    }
  });

  return services;
}

exports.compute = compute;
