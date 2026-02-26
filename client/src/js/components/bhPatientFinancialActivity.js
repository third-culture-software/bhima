angular.module('bhima.components')
  .component('bhPatientFinancialActivity', {
    controller   : PatientFinancialActivityCtrl,
    templateUrl  : 'modules/patients/record/bh-patient-financial-activity.html',
    bindings     : {
      patientUuid : '<',
    },
  });

PatientFinancialActivityCtrl.$inject = [
  'PatientService', 'moment', 'SessionService',
  'bhConstants', '$q',
];

/**
 * @param Patients
 * @param moment
 * @param Session
 * @param Constants
 * @param $q
 * @function PatientFinancialActivityCtrl
 * @description
 * This component is responsible for giving an overview of the patient's
 * financial situation.
 */
function PatientFinancialActivityCtrl(Patients, moment, Session, Constants, $q) {
  const $ctrl = this;

  // TODO(@jniles) - add the ability for users to change this
  const EXCESSIVE_DEBT_LIMIT = 250000; // FC (enterprise currency)
  const OLD_DEBT_LIMIT = 30; // days

  this.$onInit = () => {
    $ctrl.enterpriseCurrencyId = Session.enterprise.currency_id;
    angular.merge($ctrl, { EXCESSIVE_DEBT_LIMIT, OLD_DEBT_LIMIT });

    $ctrl.DATE_FORMAT = Constants.dates.format;

    $ctrl.loading = true;

    $q.all([
      Patients.getFinancialActivity($ctrl.patientUuid),
      Patients.getStockMovements($ctrl.patientUuid),
    ])
      .then(([financialData, stockData]) => {
        $ctrl.data = financialData;
        const dataMovement = [];
        $ctrl.dataMovementTotalValue = 0;

        // limit this to the most recent stock movements items
        const limitRecent = 5;

        // indicate that the patient does not have a financial history
        $ctrl.noFinancialHistory = financialData.transactions.length === 0;

        $ctrl.status = calculateFinancialStatus(financialData.transactions, financialData.aggregates);
        $ctrl.groups = groupFinancialRecords(financialData.transactions);

        $ctrl.hasWarnings = (
          $ctrl.status.hasExcessiveDebt
          || $ctrl.status.hasCreditorBalance
          || $ctrl.status.hasOldDebt
        );

        // used in i18n texts
        $ctrl.i18nValues = {
          date : new Date(financialData.aggregates.until),
          balance : Math.abs(financialData.aggregates.balance),
          currency_id : Session.enterprise.currency_id,
        };

        stockData.forEach((item, index) => {
          if (index < limitRecent) {
            dataMovement.push(item);
          }

          $ctrl.dataMovementTotalValue += item.value;
        });

        $ctrl.dataMovement = dataMovement;
        $ctrl.noStockMovement = stockData.length === 0;
        $ctrl.totalMovementCount = stockData.length;
      }).finally(() => {
        $ctrl.loading = false;
      });
  };

  /**
   * @param transactions
   * @param totals
   * @function calculateFinancialStatus
   * @description
   */
  function calculateFinancialStatus(transactions, totals) {
    const hasExcessiveDebt = (totals.balance >= EXCESSIVE_DEBT_LIMIT);
    const hasDebtorBalance = (totals.balance > 0);
    const hasCreditorBalance = (totals.balance < 0);

    // hasOldDebt checks if there is debt and it is too old
    const isOldDebt = (date) => (moment().diff(date, 'days') >= OLD_DEBT_LIMIT);
    const hasOldDebt = hasDebtorBalance && isOldDebt(totals.until);

    const isInGoodStanding = !(hasExcessiveDebt || hasOldDebt);

    return {
      hasExcessiveDebt,
      hasCreditorBalance,
      hasOldDebt,
      isInGoodStanding,
    };
  }

  // returns IV, CP, VO by parsing on the document id
  const ident = (record) => record.document.slice(0, 2);

  // make a record object for tracking records
  const mkRecord = () => ({
    count : 0,
    lastDate : null,
    lastUuid : null,
    lastAmount : 0,
    totalAmount : 0,
  });

  /**
   *
   * @param transactions
   */
  function groupFinancialRecords(transactions) {
    // summary of all the types of financial records
    const records = {
      VO : mkRecord(),
      IV : mkRecord(),
      CP : mkRecord(),
    };

    transactions.forEach(record => {
      const summary = records[ident(record)];
      summary.count++;
      summary.lastDate = record.trans_date;
      summary.lastUuid = record.record_uuid;
      summary.lastAmount = Math.abs(record.balance);
      summary.totalAmount += record.balance;
    });

    const isCreditBalance = balance => balance < 0;
    records.VO.isCreditBalance = isCreditBalance(records.VO.totalAmount);
    records.IV.isCreditBalance = isCreditBalance(records.IV.totalAmount);
    records.CP.isCreditBalance = isCreditBalance(records.CP.totalAmount);

    return records;
  }
}
