const { expect } = require('chai');
const {
  calculateLotsUsageSchedule,
  getDaysBetween,
} = require('../../../server/controllers/stock/lot-usage-calculator');

describe('#calculateLotsUsageSchedule() - Multiple lots', () => {
  it('should consume lots sequentially in FIFO order', () => {
    const lots = [
      { quantity : 50, unit_cost : 10, expiration_date : new Date('2025-03-01') },
      { quantity : 50, unit_cost : 10, expiration_date : new Date('2025-06-01') },
      { quantity : 50, unit_cost : 10, expiration_date : new Date('2025-09-01') },
    ];
    const startDate = new Date('2025-01-01');
    const avgConsumption = 30; // 1 unit/day approx

    const results = calculateLotsUsageSchedule(lots, startDate, avgConsumption);

    // First lot starts on Jan 1
    expect(results[0].start_date.toISOString()).to.equal('2025-01-01T00:00:00.000Z');

    // Second lot should start when first ends
    expect(results[1].start_date.toISOString()).to.equal(results[0].end_date.toISOString());

    // Third lot should start when second ends
    expect(results[2].start_date.toISOString()).to.equal(results[1].end_date.toISOString());
  });

  it('should handle partial consumption carryover between lots', () => {
    const lots = [
      { quantity : 25, unit_cost : 10, expiration_date : new Date('2026-12-31') },
      { quantity : 75, unit_cost : 10, expiration_date : new Date('2026-12-31') },
    ];
    const startDate = new Date('2025-01-01');
    const avgConsumption = 30.5; // 1 unit/day

    const results = calculateLotsUsageSchedule(lots, startDate, avgConsumption);

    // First lot: 25 units at 1/day = 25 days
    expect(results[0].num_days).to.equal(25);

    // Second lot should continue same day
    const daysBetween = getDaysBetween(results[0].start_date, results[1].start_date);
    expect(daysBetween).to.equal(25);
  });

  it('should stop consuming after expiration and continue with next lot', () => {
    const lots = [
      { quantity : 1000, unit_cost : 10, expiration_date : new Date('2025-02-01') },
      { quantity : 100, unit_cost : 10, expiration_date : new Date('2026-12-31') },
    ];
    const startDate = new Date('2025-01-01');
    const avgConsumption = 30; // 1 unit/day

    const results = calculateLotsUsageSchedule(lots, startDate, avgConsumption);

    // First lot expires before exhaustion
    expect(results[0].premature_expiration).to.equal(true);
    expect(results[0].quantity_wasted).to.be.greaterThan(0);

    // Second lot starts on expiration of first
    expect(results[1].start_date.toISOString()).to.equal('2025-02-01T00:00:00.000Z');
  });
});
