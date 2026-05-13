/**
 * this class helps to get start date and end date of a period
 */

class BhMoment {
  constructor(date) {
    this.value = date ? new Date(date) : new Date();
  }

  day() {
    const d = this.value;
    return {
      dateFrom: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
      dateTo: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
    };
  }

  week() {
    const d = this.value;
    const firstDay = d.getDate() - d.getDay(); // Start of week defaults to Sunday (0)
    
    return {
      dateFrom: new Date(d.getFullYear(), d.getMonth(), firstDay, 0, 0, 0, 0),
      dateTo: new Date(d.getFullYear(), d.getMonth(), firstDay + 6, 23, 59, 59, 999),
    };
  }

  month() {
    const d = this.value;
    return {
      dateFrom: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0),
      // Day 0 of the next month resolves to the last day of the current month
      dateTo: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  year() {
    const d = this.value;
    return {
      dateFrom: new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0),
      dateTo: new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }
}

module.exports = BhMoment;
