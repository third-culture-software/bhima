// shared constants identical to `bhConstants` on the client side

// TODO(@jniles) unify this with `bhConstants` and build the same
// constant configuration across the client/server.

module.exports = {
  actions : {
    CAN_EDIT_ROLES : 1,
    CAN_UNPOST_TRANSACTIONS : 2,
    DELETE_CASH_PAYMENT : 3,
    DELETE_INVOICE : 4,
    DELETE_PURCHASE_ORDER : 5,
    DELETE_STOCK_MOVEMENT : 6,
    DELETE_VOUCHER : 7,
    EDIT_LOT : 8,
    VALIDATE_REQUISITION : 9,
  },
  accounts : {
    ROOT  : 0,
    ASSET : 1,
    LIABILITY : 2,
    EQUITY : 3,
    INCOME : 4,
    EXPENSE : 5,
    TITLE : 6,
  },
  allocationBasis : {
    /* NOTE: Must match values in bhima.sql */
    ALLOCATION_BASIS_DIRECT_COST : 1,
    ALLOCATION_BASIS_NUM_EMPLOYEES : 2,
    ALLOCATION_BASIS_AREA_USED : 3,
    ALLOCATION_BASIS_ELECTRICITY_CONSUMED : 4,
    ALLOCATION_BASIS_NUM_COMPUTERS : 5,
    ALLOCATION_BASIS_NUM_LABOR_HOURS : 6,
  },
  assetCondition : [
    { id : 1, label : 'ASSET.CONDITION.NEW' },
    { id : 2, label : 'ASSET.CONDITION.GOOD' },
    { id : 3, label : 'ASSET.CONDITION.FAIR' },
    { id : 4, label : 'ASSET.CONDITION.POOR' },
    { id : 5, label : 'ASSET.CONDITION.BROKEN' },
    { id : 6, label : 'ASSET.CONDITION.OBSOLETE' },
    { id : 7, label : 'ASSET.CONDITION.DISCARDED' },
    { id : 8, label : 'ASSET.CONDITION.SOLD' },
    { id : 9, label : 'ASSET.CONDITION.LOST' },
  ],
  settings : {
    CONTACT_EMAIL : 'developers@imaworldhealth.org',
  },
  barcodes : {
    LENGTH : 10,
  },
  transactionType : {
    GENERIC_INCOME     : 1,
    CASH_PAYMENT       : 2,
    CONVENTION_PAYMENT : 3,
    SUPPORT_INCOME     : 4,
    TRANSFER           : 5,
    GENERIC_EXPENSE    : 6,
    SALARY_PAYMENT     : 7,
    CASH_RETURN        : 8,
    PURCHASES          : 9,
    CREDIT_NOTE        : 10,
    INVOICING          : 11,
    STOCK_INTEGRATION  : 12,
    STOCK_EXIT         : 13,
    STOCK_ENTRY        : 14,
    INCOME             : 'income',
    EXPENSE            : 'expense',
    OTHER              : 'other',
  },
  flux : {
    FROM_PURCHASE    : 1,
    FROM_OTHER_DEPOT : 2,
    FROM_ADJUSTMENT  : 3,
    FROM_PATIENT     : 4,
    FROM_SERVICE     : 5,
    FROM_DONATION    : 6,
    FROM_LOSS        : 7,
    TO_OTHER_DEPOT   : 8,
    TO_PATIENT       : 9,
    TO_SERVICE       : 10,
    TO_LOSS          : 11,
    TO_ADJUSTMENT    : 12,
    FROM_INTEGRATION : 13,
    INVENTORY_RESET  : 14,
    INVENTORY_ADJUSTMENT : 15,
    AGGREGATED_CONSUMPTION : 16,
  },
  stockRequisition : {
    completed_status : 6,
  },
  stockStatus : {
    IS_STOCK_OUT         : 'stock_out',
    IS_IN_STOCK          : 'in_stock',
    HAS_SECURITY_WARNING : 'security_reached',
    HAS_MINIMUM_WARNING  : 'minimum_reached',
    HAS_OVERAGE_WARNING  : 'over_maximum',
    UNUSED_STOCK         : 'unused_stock',
    AVAILABLE_NOT_USABLE : 'available_not_usable',
  },
  reports : {
    AGED_DEBTOR    : 'AGED_DEBTOR',
    CASHFLOW       : 'CASHFLOW',
    INCOME_EXPENSE : 'INCOME_EXPENSE',
  },
  precision : {
    MAX_DECIMAL_PRECISION : 4,
    MAX_INTEGER : 16777215, // maximum unsigned MEDIUM INT in MySQL
  },
  weekDays : [
    { id : 0, label : 'FORM.LABELS.WEEK_DAYS.SUNDAY', checked : false },
    { id : 1, label : 'FORM.LABELS.WEEK_DAYS.MONDAY', checked : false },
    { id : 2, label : 'FORM.LABELS.WEEK_DAYS.TUESDAY', checked : false },
    { id : 3, label : 'FORM.LABELS.WEEK_DAYS.WEDNESDAY', checked : false },
    { id : 4, label : 'FORM.LABELS.WEEK_DAYS.THURSDAY', checked : false },
    { id : 5, label : 'FORM.LABELS.WEEK_DAYS.FRIDAY', checked : false },
    { id : 6, label : 'FORM.LABELS.WEEK_DAYS.SATURDAY', checked : false },
  ],
  transactionTypeMap : {
    income : { label : 'VOUCHERS.SIMPLE.INCOME', value : 'income' },
    expense : { label : 'VOUCHERS.SIMPLE.EXPENSE', value : 'expense' },
    other : { label : 'FORM.LABELS.OTHER', value : 'other' },
  },
  gender : [
    { translation_key : 'FORM.LABELS.MALE', value : 'M' },
    { translation_key : 'FORM.LABELS.FEMALE', value : 'F' },
    { translation_key : 'FORM.LABELS.OTHER', value : 'O' },
  ],
  purchaseStatus : {
    WAITING_CONFIRMATION : 1,
    CONFIRMED : 2,
    RECEIVED : 3,
    PARTIALLY_RECEIVED : 4,
    CANCELLED : 5,
    EXCESSIVE_RECEIVED_QUANTITY : 6,
  },

  /* MUST match budgetPeriods() in client bhConstants.js */
  /* eslint-disable no-multi-spaces */
  periods : [
    { periodNum : 0,  label : 'PERIODS.NAME.ALL',       key : 'all' },
    { periodNum : 1,  label : 'PERIODS.NAME.JANUARY',   key : 'jan' },
    { periodNum : 2,  label : 'PERIODS.NAME.FEBRUARY',  key : 'feb' },
    { periodNum : 3,  label : 'PERIODS.NAME.MARCH',     key : 'mar' },
    { periodNum : 4,  label : 'PERIODS.NAME.APRIL',     key : 'apr' },
    { periodNum : 5,  label : 'PERIODS.NAME.MAY',       key : 'may' },
    { periodNum : 6,  label : 'PERIODS.NAME.JUNE',      key : 'jun' },
    { periodNum : 7,  label : 'PERIODS.NAME.JULY',      key : 'jul' },
    { periodNum : 8,  label : 'PERIODS.NAME.AUGUST',    key : 'aug' },
    { periodNum : 9,  label : 'PERIODS.NAME.SEPTEMBER', key : 'sep' },
    { periodNum : 10, label : 'PERIODS.NAME.OCTOBER',   key : 'oct' },
    { periodNum : 11, label : 'PERIODS.NAME.NOVEMBER',  key : 'nov' },
    { periodNum : 12, label : 'PERIODS.NAME.DECEMBER',  key : 'dec' },
  ],
  /* eslint-enable */

};
