/**
 *
 * @description
 * This function is used to manage different data for the payment configuration,
 * filter holidays that are not in the configuration of weekends, deconsidere holidays days which are holidays
 * but also in the configuration of weeks ends and calculates the number of working days in a pay period
 *
 * NOTE(@jniles) - the word "holidays" actually means "vacation days" for a given employee.  It is
 * not a national/international holiday on the calendar.  The calendar holidays are called "offdays".
 */

const moment = require('moment');

const {
  isDateOnWeekend,
  createDateRange,
} = require('./datelogic');

function getValidHolidays(holidays, periodFrom, periodTo, weekEndDaysIndexArray, validOffDays) {
  const validHolidays = [];

  holidays.forEach(holiday => {
    const from = new Date(holiday.dateFrom);
    const to = new Date(holiday.dateTo);
    let numberOfDays = 0;

    for (let day = from; day <= to; day.setDate(day.getDate() + 1)) {
      if (day >= periodFrom && day <= periodTo) {
        const isWeekendDay = isDateOnWeekend(day, weekEndDaysIndexArray);
        const isOnOffDay = validOffDays.some(offday => moment(offday.date).isSame(day, 'day'));
        const invalidHoliday = (isWeekendDay || isOnOffDay);

        if (!invalidHoliday) {
          numberOfDays++;
          validHolidays.push(holiday);
        }
      }
    }

    holiday.numberOfDays = numberOfDays;
  });

  return validHolidays;
}

function manageConfigurationData(rows, params) {
  const offDays = rows[1];
  const holidays = rows[2];
  const weekEndDays = rows[3];

  const periodFrom = new Date(params.dateFrom);
  const periodTo = new Date(params.dateTo);

  // make an index array of the "indice" for easy lookups.
  const weekEndDaysIndexArray = weekEndDays.map(wk => wk.indice);

  const validOffDays = offDays.filter(offDay => !isDateOnWeekend(offDay.date, weekEndDaysIndexArray));

  if (validOffDays.length) {
    rows.push(validOffDays);
  } else {
    rows.push([]);
  }

  const validHolidays = getValidHolidays(holidays, periodFrom, periodTo, weekEndDaysIndexArray, validOffDays);

  if (validHolidays.length) {
    rows.push(validHolidays);
  } else {
    rows.push([]);
  }

  // Get Working Days
  let workingDay = 0;

  const range = createDateRange(periodFrom, periodTo);

  range.forEach((day) => {
    let invalidDate = false;
    const dayIndice = new Date(day).getDay();

    weekEndDays.forEach(days => {
      if (dayIndice === days.indice) {
        invalidDate = true;
      }
    });

    if (!invalidDate) {
      workingDay++;
    }
  });

  rows.push([{ working_day : workingDay }]);

  // NOTE(@jniles): this returns an array of:
  // rubrics,
  // offdays,
  // holidays,
  // weekends,
  // taxes,
  // validOffdays,
  // validHolidays,
  // workingDays,

  // TODO(@jniles) refactor this to return structured output instead of an array.
  return rows;
}

exports.manageConfigurationData = manageConfigurationData;
