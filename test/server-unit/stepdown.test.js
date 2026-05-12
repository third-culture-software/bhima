const { describe, it }= require('node:test');
const assert = require('node:assert/strict');

const dataset = require('./stepdown.data');

describe('test/server-unit/stepdown', () => {

  const Stepdown = require('../../server/lib/stepdown');

  it('#compute() compute results for Cost Center documentation test', () => {
    const example = Stepdown.compute(dataset.SAMPLE_DOCS);
    assert.equal(example.length, 5, 'The number of cost centers should be 5');
  });

  /**
   * Step down method with sample data from
   * link: https://www.youtube.com/watch?v=yCxCF1PKVJQ
   */
  it('#compute(): compute and allocate cost to services (cost centers)', () => {
    const services = Stepdown.compute(dataset.SAMPLE_5);
    const expectedCostDistribution = dataset.SAMPLE_5_DISTRIBUTION;

    const SAMPLE_NB_SERVICES = 7;
    const SAMPLE_NB_PRINCIPAL = 3;
    const SAMPLE_NB_AUXILIARY = 4;

    const principalCenters = services.filter(serv => !!serv.principal);
    const auxiliaryCenters = services.filter(serv => !serv.principal);

    const nServices = services.length;
    const nPrincipal = principalCenters.length;
    const nAuxiliary = auxiliaryCenters.length;

    assert.equal(nServices, SAMPLE_NB_SERVICES, `The number of cost centers should be ${SAMPLE_NB_SERVICES}`);
    assert.equal(nPrincipal, SAMPLE_NB_PRINCIPAL, `The number of principal cost centers should be ${SAMPLE_NB_PRINCIPAL}`);  
    assert.equal(nAuxiliary, SAMPLE_NB_AUXILIARY, `The number of auxiliary cost centers should be ${SAMPLE_NB_AUXILIARY}`);

    const cumulatedAllocatedCosts = Array(services.length).fill(0);
    for (let i = 0; i < services.length; i++) {
      for (let j = 0; j < services[i].toDist.length; j++) {
        cumulatedAllocatedCosts[j] += i !== j ? services[i].toDist[j] : 0;
      }
    }

    services.forEach((serv, index) => {
      // distribute to each other services (cost centers) with correct values
      if (!serv.principal) {
        assert.deepEqual(serv.toDist, expectedCostDistribution[index], `The cost distribution for service ${serv.name} should match the expected values`);
      }

      // total cost is coming correctly from other cost centers
      if (serv.principal) {
        const finalCostFromAllocatedCosts = Number(cumulatedAllocatedCosts[index] + serv.directCost).toFixed(4);
        const finalCost = Number(serv.total).toFixed(4);
        assert.equal(finalCost, finalCostFromAllocatedCosts, `The total cost for service ${serv.name} should match the expected value`);
      }
    });
  });
});
