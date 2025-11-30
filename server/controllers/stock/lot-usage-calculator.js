/**
 * @module lot-usage-calculator
 *
 * @description
 * Calculates lot consumption schedules based on average consumption rates.
 * Uses FIFO (First Expired, First Out) methodology with running consumption tracking.
 */

const debug = require('debug')('bhima:lots:usage');

const DAYS_PER_MONTH = 30.5;

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function getDaysBetween(start, end) {
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

function normalizeDate(date) {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

/**
 * @function calculateLotUsageSchedule
 *
 * @description
 * Calculates the usage schedule for a single lot, considering remaining consumption
 * from previous lots.
 *
 * @param {Object} lot - The lot to calculate schedule for
 * @param {number} lot.quantity - Quantity available in the lot
 * @param {number} lot.unit_cost - Cost per unit
 * @param {Date} lot.expiration_date - When the lot expires
 * @param {Date} startDate - When consumption of this lot begins
 * @param {number} remainingDailyConsumption - Daily consumption remaining from previous lot
 * @param {number} avgConsumption - Average monthly consumption rate
 * @param {number} fallbackMonths - Months to project if consumption is zero
 *
 * @returns {Object} Schedule object with calculated dates, quantities, and next consumption
 */
function calculateLotUsageSchedule(
  lot,
  startDate,
  remainingDailyConsumption,
  avgConsumption,
  fallbackMonths = 6,
) {
  const {
    quantity,
    unit_cost : unitCost,
    expiration_date : expirationDate,
  } = lot;

  const start = normalizeDate(startDate);
  const expiration = normalizeDate(expirationDate);

  debug('Calculating lot schedule:');
  debug('  Lot: %o', {
    uuid : lot.uuid,
    label : lot.label,
    quantity,
    unit_cost : unitCost,
    expiration_date : expiration.toISOString(),
  });
  debug('  Start: %s', start.toISOString());
  debug('  Remaining consumption: %s', remainingDailyConsumption);
  debug('  Avg monthly consumption: %s', avgConsumption);

  // If no remaining consumption, use full daily rate
  const dailyConsumption = remainingDailyConsumption !== null
    ? remainingDailyConsumption
    : avgConsumption / DAYS_PER_MONTH;

  debug('  Daily consumption rate: %s', dailyConsumption);

  let exhaustedDate;
  let nextRemainingConsumption = null;

  if (avgConsumption > 0 && dailyConsumption > 0) {
    const daysUntilExhausted = Math.ceil(quantity / dailyConsumption);
    exhaustedDate = addDays(start, daysUntilExhausted);

    debug('  Days until exhausted: %s', daysUntilExhausted);
    debug('  Exhausted date: %s', exhaustedDate.toISOString());

    // Calculate if there's leftover consumption capacity for the next lot
    const actualConsumptionDays = quantity / dailyConsumption;
    const fullDaysConsumed = Math.floor(actualConsumptionDays);
    const fractionalDay = actualConsumptionDays - fullDaysConsumed;

    // Remaining consumption for next lot (if exhausted mid-day)
    nextRemainingConsumption = fractionalDay > 0 ? dailyConsumption * (1 - fractionalDay) : 0;

    debug('  Actual consumption days: %s', actualConsumptionDays);
    debug('  Fractional day remainder: %s', fractionalDay);
    debug('  Next remaining consumption: %s', nextRemainingConsumption);
  } else {
    exhaustedDate = addMonths(start, fallbackMonths);
    nextRemainingConsumption = 0;
    debug('  Zero consumption - using fallback: %s months', fallbackMonths);
    debug('  Exhausted date (fallback): %s', exhaustedDate.toISOString());
  }

  const prematureExpiration = exhaustedDate > expiration;
  const endDate = prematureExpiration ? new Date(expiration) : new Date(exhaustedDate);

  debug('  Premature expiration: %s', prematureExpiration);
  debug('  End date: %s', endDate.toISOString());

  const numDays = Math.max(0, getDaysBetween(start, endDate));
  const numMonths = numDays / DAYS_PER_MONTH;

  let quantityUsed;
  if (prematureExpiration && avgConsumption > 0) {
    quantityUsed = Math.min(Math.ceil(numDays * dailyConsumption), quantity);
    debug('  Premature expiration - calculated usage: %s', quantityUsed);
  } else {
    quantityUsed = quantity;
    debug('  Normal consumption - using full quantity: %s', quantityUsed);
  }

  const quantityWasted = Math.max(0, quantity - quantityUsed);
  const valueWasted = quantityWasted * unitCost;

  // If lot expires or is exhausted, reset remaining consumption to full rate
  if (prematureExpiration) {
    nextRemainingConsumption = dailyConsumption;
    debug('  Reset consumption for next lot due to expiration: %s', nextRemainingConsumption);
  }

  const result = {
    start_date : new Date(start),
    expiration_date : expiration,
    exhausted_date : new Date(exhaustedDate),
    end_date : new Date(endDate),
    premature_expiration : prematureExpiration,
    value : quantity * unitCost,
    num_days : numDays,
    num_months : numMonths,
    quantity_used : quantityUsed,
    quantity_wasted : quantityWasted,
    value_wasted : valueWasted,
    next_remaining_consumption : nextRemainingConsumption,
  };

  debug('  Final result: %o', {
    num_days : result.num_days,
    quantity_used : result.quantity_used,
    quantity_wasted : result.quantity_wasted,
    value_wasted : result.value_wasted,
    next_remaining_consumption : result.next_remaining_consumption,
  });

  return result;
}

/**
 * @function calculateLotsUsageSchedule
 *
 * @description
 * Calculates usage schedules for multiple lots in FIFO order, tracking
 * consumption across lots.
 *
 * @param {Array} lots - Array of lots sorted by expiration date
 * @param {Date} startDate - Initial start date
 * @param {number} avgConsumption - Average monthly consumption
 * @param {number} fallbackMonths - Fallback months if no consumption
 *
 * @returns {Array} Array of lots with calculated schedules
 */
function calculateLotsUsageSchedule(lots, startDate, avgConsumption, fallbackMonths = 6) {
  debug('=== Starting multi-lot usage calculation ===');
  debug('Total lots: %s', lots.length);
  debug('Start date: %s', startDate.toISOString());
  debug('Average monthly consumption: %s', avgConsumption);
  debug('Fallback months: %s', fallbackMonths);

  let runningDate = normalizeDate(startDate);
  let remainingConsumption = null;
  let runningBalance = 0;

  const results = lots.map((lot, index) => {
    debug('--- Processing lot %s/%s ---', index + 1, lots.length);
    debug('Running date: %s', runningDate.toISOString());
    debug('Running balance before: %s', runningBalance);

    const schedule = calculateLotUsageSchedule(
      lot,
      runningDate,
      remainingConsumption,
      avgConsumption,
      fallbackMonths,
    );

    // Update running totals
    runningBalance += schedule.quantity_used;
    runningDate = new Date(schedule.end_date);
    remainingConsumption = schedule.next_remaining_consumption;

    debug('Running balance after: %s', runningBalance);
    debug('Next lot starts: %s', runningDate.toISOString());
    debug('Carryover consumption: %s', remainingConsumption);

    return {
      ...lot,
      ...schedule,
    };
  });

  debug('=== Multi-lot calculation complete ===');
  debug('Total quantity consumed: %s', runningBalance);
  debug('Final end date: %s', runningDate.toISOString());

  const totalValue = results.reduce((sum, lot) => sum + lot.value, 0);
  const totalWasted = results.reduce((sum, lot) => sum + lot.quantity_wasted, 0);
  const totalWastedValue = results.reduce((sum, lot) => sum + lot.value_wasted, 0);

  debug('Summary - Total value: %s, Wasted: %s units (value: %s)',
    totalValue, totalWasted, totalWastedValue);

  return results;
}

module.exports = {
  calculateLotUsageSchedule,
  calculateLotsUsageSchedule,
  DAYS_PER_MONTH,
  addDays,
  addMonths,
  getDaysBetween,
  normalizeDate,
};
