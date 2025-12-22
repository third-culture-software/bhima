/**
 * stock shared variables as database
 */
const moment = require('moment');
const helpers = require('../helpers');

// stock flux
const flux = {
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
  AGGREGATE_CONSUMPTION : 16,
};

// initial movement of five lots
const lots = [
  {
    label            : 'T-QUININE-A',
    quantity         : 100,
    unit_cost        : 1.2,
    expiration_date  : moment(new Date(), 'YYYY-MM-DD').subtract(923, 'days'),
    inventory_uuid   : helpers.data.QUININE,
    origin_uuid      : 'e07ceadc-82cf-4ae2-958a-6f6a78c87588',
  },

  {
    label            : 'T-QUININE-B',
    quantity         : 200,
    unit_cost        : 0.8,
    expiration_date  : moment(new Date(), 'YYYY-MM-DD').subtract(923, 'days'),
    inventory_uuid   : helpers.data.QUININE,
    origin_uuid      : 'e07ceadc-82cf-4ae2-958a-6f6a78c87588',
  },

  {
    label            : 'T-QUININE-C',
    quantity         : 50,
    unit_cost        : 2,
    expiration_date  : moment(new Date(), 'YYYY-MM-DD').subtract(1288, 'days'),
    inventory_uuid   : helpers.data.QUININE,
    origin_uuid      : 'e07ceadc-82cf-4ae2-958a-6f6a78c87588',
  },

  {
    label            : 'T-VITAMINE-A',
    quantity         : 100,
    unit_cost        : 1.2,
    expiration_date  : moment(new Date(), 'YYYY-MM-DD').subtract(1288, 'days'),
    inventory_uuid   : helpers.data.MULTIVITAMINE,
    origin_uuid      : 'e07ceadc-82cf-4ae2-958a-6f6a78c87588',
  },

  {
    label            : 'T-VITAMINE-B',
    quantity         : 20,
    unit_cost        : 0.5,
    expiration_date  : moment(new Date(), 'YYYY-MM-DD').subtract(192, 'days'),
    inventory_uuid   : helpers.data.MULTIVITAMINE,
    origin_uuid      : 'e07ceadc-82cf-4ae2-958a-6f6a78c87588',
  },
];

const movementFirstLots = {
  depot_uuid : 'f9caeb16-1684-43c5-a6c4-47dbac1df296',
  date       : new Date(),
  flux_id    : 1,
  user_id    : 1,
  description : 'Initial Lot Movement',
  lots,
};

const movementFromDonation = {
  depot_uuid  : 'f9caeb16-1684-43c5-a6c4-47dbac1df296',
  date        : new Date(),
  is_exit     : 0,
  description : 'Stock entry from a donation',
  flux_id     : flux.FROM_DONATION,
  user_id     : 1,
  lots        : [
    {
      inventory_uuid : helpers.data.QUININE,
      quantity  : 20,
      label : 'don1',
      unit_cost : 1.5,
      origin_uuid : 'ae735e99-8faf-417b-aa63-9b404fca390d',
      expiration_date : moment(new Date(), 'YYYY-MM-DD').add(10685, 'days'),
    }, {
      inventory_uuid : helpers.data.MULTIVITAMINE,
      quantity  : 10,
      unit_cost : 2,
      label : 'don2',
      origin_uuid : 'ae735e99-8faf-417b-aa63-9b404fca390d',
      expiration_date : moment(new Date(), 'YYYY-MM-DD').add(10685, 'days'),
    },
  ],
};
const movementOutPatient = {
  depot_uuid  : 'f9caeb16-1684-43c5-a6c4-47dbac1df296',
  entity_uuid : '274c51ae-efcc-4238-98c6-f402bfb39866',
  date        : new Date(),
  is_exit     : 1,
  description : 'Stock Exit to patient',
  flux_id     : flux.TO_PATIENT,
  user_id     : 1,
  lots        : [
    {
      inventory_uuid : helpers.data.QUININE,
      uuid      : 'AE735E998FAF417BAA639B404FCA99AC', // QUININE-A
      quantity  : 20,
      unit_cost : 1.5,
    }, {
      inventory_uuid : helpers.data.MULTIVITAMINE,
      uuid      : '064AB1D952464402AE8A958FCDB07B35', // VITAMINE-A
      quantity  : 10,
      unit_cost : 2,
    },
  ],
};

const movementDepot = {
  from_depot : 'f9caeb16-1684-43c5-a6c4-47dbac1df296',
  to_depot   : 'd4bb1452-e4fa-4742-a281-814140246877',
  date       : new Date(),
  user_id    : 1,
  description : 'Stock movement between depot',
  lots       : [
    {
      inventory_uuid : helpers.data.QUININE,
      uuid      : '6F80748B1D944247804ED4BE99E827D2', // QUININE-B
      quantity  : 50,
      unit_cost : 1.5,
    }, {
      inventory_uuid : helpers.data.MULTIVITAMINE,
      uuid      : '064AB1D952464402AE8A958FCDB07B35', // VITAMINE-A
      quantity  : 10,
      unit_cost : 2,
    },
  ],
};

const depotPrincipalUuid = 'F9CAEB16168443C5A6C447DBAC1DF296';
const depotPrincipalMvt = 22;
const lotQuinineUuid = 'ae735e99-8faf-417b-aa63-9b404fca99ac';

const assetMot1 = 'F16982E279AC4FC397BFF69105CB33F1';
const assetMot2 = '4A1039DDF0644CDDBC945A9A40CF7EC5';

const depotSecondaireUuid = 'D4BB1452E4FA4742A281814140246877';
const lotVitamineA = '064AB1D952464402AE8A958FCDB07B35';
const personEntityUuid = '00099B1D184A48DEB93D45FBD0AB3790';
const enterpriseEntityUuid = '037AC6C6B75A4E328E9DCDE5DA22BACE';
const serviceAdministrationUuid = 'B1816006555845F993A0C222B5EFA6CB';

const newPersonAssign = {
  depot_uuid : depotPrincipalUuid,
  lot_uuid : lotQuinineUuid,
  entity_uuid : personEntityUuid,
  quantity : 1,
  description : 'Person stock assignment',
};

const newPersonAssign2 = {
  depot_uuid : depotSecondaireUuid,
  lot_uuid : lotQuinineUuid,
  entity_uuid : personEntityUuid,
  quantity : 1,
  description : 'Person stock assignment again',
};

const newEnterpriseAssign = {
  depot_uuid : depotPrincipalUuid,
  lot_uuid : lotQuinineUuid,
  entity_uuid : enterpriseEntityUuid,
  quantity : 1,
  description : 'Enterprise stock assignment',
};

const requisitionFromService = {
  requestor_uuid : 'aff85bdc-d7c6-4047-afe7-1724f8cd369e', // test service
  requestor_type_id : 1,
  depot_uuid : depotPrincipalUuid,
  description : 'Requisition for the Test Service',
  date : new Date(),
  items : [
    {
      inventory_uuid : helpers.data.QUININE,
      quantity  : 50,
    }, {
      inventory_uuid : helpers.data.MULTIVITAMINE,
      quantity  : 10,
    },
  ],
};

const requisitionFromDepot = {
  requestor_uuid : depotSecondaireUuid,
  requestor_type_id : 2,
  depot_uuid : depotPrincipalUuid,
  description : 'Requisition for a depot',
  date : new Date(),
  items : [
    {
      inventory_uuid : helpers.data.QUININE,
      quantity  : 5,
    }, {
      inventory_uuid : helpers.data.MULTIVITAMINE,
      quantity  : 5,
    },
  ],
};

const getMovementDate = moment(new Date(), 'YYYY-MM-DD').subtract(80, 'days');
const getMovementMonth = moment(getMovementDate).month();
const getMovementYear = moment(getMovementDate).year();
// Get the last days of period
const getLastDays = new Date(getMovementYear, getMovementMonth + 1, 0);

const getMovementComplexeDate = moment(new Date(), 'YYYY-MM-DD').subtract(60, 'days');
const getMovementMonthComplexe = moment(getMovementComplexeDate).month();
const getMovementYearComplexe = moment(getMovementComplexeDate).year();

const getLastDaysComplexe = new Date(getMovementYearComplexe, getMovementMonthComplexe + 1, 0);

const movementStandardAggregate = {
  depot_uuid : 'BD4B14524742E4FAA128246814140877',
  date  : getLastDays,
  description : 'Aggregated consumption for November',
  is_exit : 0,
  flux_id : `${getMovementYear}${getMovementMonth + 1}`,
  user_id : 1,
  stock_out : {
    '43F3DECBFCE9426E940AB2150E62186C' : 0,
    '43F3DECBFCE9940A426EE62186BC2150' : 0,
  },
  fiscal_id : 6,
  period_id : 202011,
  lots : [
    {
      inventory_uuid : '43F3DECBFCE9426E940AB2150E62186C',
      code : 'DDIS_IODP1S2_0',
      label : 'lot 1',
      quantity : 1000,
      unit_cost : 1.46,
      expiration_date : '2023-02-07T23:00:00.000Z',
      lots : [],
      isValid : null,
      id : 0,
      uuid : 'E36AFF4F99C244A897B770E34A21E658',
      text : 'Polyvidone iodée, 10%, 200ml, flacon, Unité',
      _initialised : true,
      old_quantity : 1000,
      quantity_consumed : 250,
      quantity_lost : 0,
      oldQuantity : 1000,
    },
    {
      inventory_uuid : '43F3DECBFCE9426E940AB2150E62186C',
      code : 'DDIS_IODP1S2_0',
      label : 'lot 2',
      quantity : 1000,
      unit_cost : 1.46,
      expiration_date : '2023-02-07T23:00:00.000Z',
      lots : [],
      isValid : null,
      id : 1,
      uuid : 'ACAA9876EF834D9F84E1BB7C2AF22777',
      text : 'Polyvidone iodée, 10%, 200ml, flacon, Unité',
      _initialised : true,
      old_quantity : 1000,
      quantity_consumed : 250,
      quantity_lost : 0,
      oldQuantity : 1000,
    },
    {
      inventory_uuid : '43F3DECBFCE9940A426EE62186BC2150',
      code : 'DDIS_IODP1S2_5',
      label : 'PL1',
      quantity : 1000,
      unit_cost : 9.51,
      expiration_date : '2023-02-07T23:00:00.000Z',
      lots : [],
      isValid : null,
      id : 2,
      uuid : 'D080D354417D47F18E8B1561E98823D9',
      text : 'Polyvidone iodée, 10%, 500ml, flacon, Unité',
      _initialised : true,
      old_quantity : 1000,
      quantity_consumed : 150,
      quantity_lost : 250,
      oldQuantity : 1000,
    }],
};

let formatedMonth = getMovementMonthComplexe + 1;

if (formatedMonth < 10) {
  formatedMonth = `0${formatedMonth}`;
}

const movementComplexeAggregate = {
  depot_uuid : 'BD4B14524742E4FAA128246814140877',
  date : getLastDaysComplexe,
  description : 'Aggregated consumption for December',
  is_exit : 0,
  flux_id : 16,
  user_id : 1,
  stock_out : {
    '43F3DECBFCE9426E940AB2150E62186C' : 0,
    '43F3DECBFCE9940A426EE62186BC2150' : 20,
  },
  fiscal_id : 6,
  period_id : `${getMovementYearComplexe}${formatedMonth}`,
  lots : [
    {
      inventory_uuid : '43F3DECBFCE9426E940AB2150E62186C',
      code : 'DDIS_IODP1S2_0',
      label : 'lot 1',
      quantity : 750,
      unit_cost : 1.46,
      expiration_date : '2023-02-07T23:00:00.000Z',
      lots : [],
      isValid : null,
      id : 0,
      uuid : 'E36AFF4F99C244A897B770E34A21E658',
      text : 'Polyvidone iodée, 10%, 200ml, flacon, Unité',
      _initialised : true,
      old_quantity : 750,
      quantity_consumed : 500,
      quantity_lost : 250,
      detailed : [
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(30, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(28, 'days'),
          unit_cost :  null,
          quantity_consumed :  0,
          quantity_lost :  95,
          isInvalid :  false,
          isValid :  true,
          identifier :  '733aae8a-9d50-4876-a595-7c4aa83717dd',
          _error :  null,
        },
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(22, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(20, 'days'),
          unit_cost :  null,
          quantity_consumed :  0,
          quantity_lost :  155,
          isInvalid :  false,
          isValid :  true,
          identifier :  '4afb3aac-f711-418b-9550-453dc0b966d7',
          _error :  null,
        },
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(16, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(14, 'days'),
          unit_cost :  null,
          quantity_consumed :  225,
          quantity_lost :  0,
          isInvalid :  false,
          isValid :  true,
          identifier :  '9e87fa50-dc9c-4caa-8f3a-e3ad8032f9b3',
          _error :  null,
        },
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(7, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(5, 'days'),
          unit_cost :  null,
          quantity_consumed :  125,
          quantity_lost :  0,
          isInvalid :  false,
          isValid :  true,
          identifier :  '5671481b-dbba-4001-877e-58b20fd664da',
          _error :  null,
        },
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(4, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(2, 'days'),
          unit_cost :  null,
          quantity_consumed :  150,
          quantity_lost :  0,
          isInvalid :  false,
          isValid :  true,
          identifier :  'd3ad7fc4-b0d5-40ad-8182-02d306700c79',
          _error :  null,
        },
      ],
      oldQuantity  :  750,
    },
    {
      inventory_uuid : '43F3DECBFCE9426E940AB2150E62186C',
      code : 'DDIS_IODP1S2_0',
      label : 'lot 2',
      quantity : 750,
      unit_cost : 1.46,
      expiration_date : '2023-02-07T23:00:00.000Z',
      lots : [],
      isValid : null,
      id : 1,
      uuid : 'ACAA9876EF834D9F84E1BB7C2AF22777',
      text : 'Polyvidone iodée, 10%, 200ml, flacon, Unité',
      _initialised : true,
      old_quantity : 750,
      quantity_consumed : 500,
      quantity_lost : 250,
      detailed : [
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(14, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(12, 'days'),
          unit_cost :  null,
          quantity_consumed :  125,
          quantity_lost :  0,
          isInvalid :  false,
          isValid :  true,
          identifier :  '5671481b-dbba-4001-877e-58b20fd664da',
          _error :  null,
        },
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(6, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(4, 'days'),
          unit_cost :  null,
          quantity_consumed :  375,
          quantity_lost :  250,
          isInvalid :  false,
          isValid :  true,
          identifier :  'd3ad7fc4-b0d5-40ad-8182-02d306700c79',
          _error :  null,
        },
      ],
      start_date : '2020-11-30T23:00:00.000Z',
      end_date : '2020-12-30T23:00:00.000Z',
      oldQuantity : 750,
    },
    {
      inventory_uuid : '43F3DECBFCE9940A426EE62186BC2150',
      code : 'DDIS_IODP1S2_5',
      label : 'PL1',
      quantity : 600,
      unit_cost : 9.51,
      expiration_date : '2023-02-07T23:00:00.000Z',
      lots : [],
      isValid : null,
      id : 2,
      uuid : 'D080D354417D47F18E8B1561E98823D9',
      text : 'Polyvidone iodée, 10%, 500ml, flacon, Unité',
      _initialised : true,
      old_quantity : 600,
      quantity_consumed : 550,
      quantity_lost : 50,
      oldQuantity : 600,
    },
  ],
};

const movementOverConsumptionAggregate = {
  depot_uuid : 'BD4B14524742E4FAA128246814140877',
  date : getLastDaysComplexe,
  description : 'Aggregated consumption for December',
  is_exit : 0,
  flux_id : 16,
  user_id : 1,
  stock_out : {
    '43F3DECBFCE9426E940AB2150E62186C' : 0,
    '43F3DECBFCE9940A426EE62186BC2150' : 20,
  },
  fiscal_id : 6,
  period_id : `${getMovementYearComplexe}${formatedMonth}`,
  lots : [
    {
      inventory_uuid : '43F3DECBFCE9426E940AB2150E62186C',
      code : 'DDIS_IODP1S2_0',
      label : 'lot 1',
      quantity : 750,
      unit_cost : 1.46,
      expiration_date : '2023-02-07T23:00:00.000Z',
      lots : [],
      isValid : null,
      id : 0,
      uuid : 'E36AFF4F99C244A897B770E34A21E658',
      text : 'Polyvidone iodée, 10%, 200ml, flacon, Unité',
      _initialised : true,
      old_quantity : 750,
      quantity_consumed : 500,
      quantity_lost : 250,
      detailed : [
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(30, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(28, 'days'),
          unit_cost :  null,
          quantity_consumed :  0,
          quantity_lost :  95,
          isInvalid :  false,
          isValid :  true,
          identifier :  '733aae8a-9d50-4876-a595-7c4aa83717dd',
          _error :  null,
        },
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(22, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(20, 'days'),
          unit_cost :  null,
          quantity_consumed :  0,
          quantity_lost :  155,
          isInvalid :  false,
          isValid :  true,
          identifier :  '4afb3aac-f711-418b-9550-453dc0b966d7',
          _error :  null,
        },
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(16, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(14, 'days'),
          unit_cost :  null,
          quantity_consumed :  225,
          quantity_lost :  0,
          isInvalid :  false,
          isValid :  true,
          identifier :  '9e87fa50-dc9c-4caa-8f3a-e3ad8032f9b3',
          _error :  null,
        },
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(7, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(5, 'days'),
          unit_cost :  null,
          quantity_consumed :  125,
          quantity_lost :  0,
          isInvalid :  false,
          isValid :  true,
          identifier :  '5671481b-dbba-4001-877e-58b20fd664da',
          _error :  null,
        },
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(4, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(2, 'days'),
          unit_cost :  null,
          quantity_consumed :  150,
          quantity_lost :  0,
          isInvalid :  false,
          isValid :  true,
          identifier :  'd3ad7fc4-b0d5-40ad-8182-02d306700c79',
          _error :  null,
        },
      ],
      oldQuantity  :  750,
    },
    {
      inventory_uuid : '43F3DECBFCE9426E940AB2150E62186C',
      code : 'DDIS_IODP1S2_0',
      label : 'lot 2',
      quantity : 750,
      unit_cost : 1.46,
      expiration_date : '2023-02-07T23:00:00.000Z',
      lots : [],
      isValid : null,
      id : 1,
      uuid : 'ACAA9876EF834D9F84E1BB7C2AF22777',
      text : 'Polyvidone iodée, 10%, 200ml, flacon, Unité',
      _initialised : true,
      old_quantity : 750,
      quantity_consumed : 500,
      quantity_lost : 250,
      detailed : [
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(14, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(12, 'days'),
          unit_cost :  null,
          quantity_consumed :  125,
          quantity_lost :  0,
          isInvalid :  false,
          isValid :  true,
          identifier :  '5671481b-dbba-4001-877e-58b20fd664da',
          _error :  null,
        },
        {
          start_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(6, 'days'),
          end_date : moment(new Date(getLastDaysComplexe), 'YYYY-MM-DD').subtract(4, 'days'),
          unit_cost :  null,
          quantity_consumed :  375,
          quantity_lost :  250,
          isInvalid :  false,
          isValid :  true,
          identifier :  'd3ad7fc4-b0d5-40ad-8182-02d306700c79',
          _error :  null,
        },
      ],
      start_date : '2020-11-30T23:00:00.000Z',
      end_date : '2020-12-30T23:00:00.000Z',
      oldQuantity : 750,
    },
    {
      inventory_uuid : '43F3DECBFCE9940A426EE62186BC2150',
      code : 'DDIS_IODP1S2_5',
      label : 'PL1',
      quantity : 600,
      unit_cost : 9.51,
      expiration_date : '2023-02-07T23:00:00.000Z',
      lots : [],
      isValid : null,
      id : 2,
      uuid : 'D080D354417D47F18E8B1561E98823D9',
      text : 'Polyvidone iodée, 10%, 500ml, flacon, Unité',
      _initialised : true,
      old_quantity : 600,
      quantity_consumed : 550,
      quantity_lost : 50,
      oldQuantity : 600,
    },
  ],
};

const invalidAggregateMovement = {
  depot_uuid : 'F9CAEB16168443C5A6C447DBAC1DF296',
  date : getLastDays,
  description : 'Check Invalid date',
  is_exit : 0,
  flux_id : 16,
  user_id : 1,
  fiscal_id : 6,
  period_id : 202001,
  lots : [
    {
      inventory_uuid : '43F3DECBFCE9426E940ABC2150E62186',
      code : 'DORA_QUIN1S-_0',
      label : 'Lot Quinine Updated',
      quantity : 20,
      unit_cost : 1.7,
      lots : [],
      isValid : null,
      id : 2,
      uuid : 'AE735E998FAF417BAA639B404FCA99AC',
      text : 'Quinine Bichlorhydrate, sirop, 100mg base/5ml, 100ml, flacon, Unité',
      _initialised : true,
      old_quantity : 20,
      quantity_consumed : 120,
      quantity_lost : 100,
      oldQuantity : 20,
    },
  ],
};

const adjustmentPrevention = {
  depot_uuid : 'BD4B14524742E4FAA128246814140877',
  date : moment(new Date(), 'YYYY-MM-DD').subtract(60, 'days'),
  description : 'Adjustement',
  is_exit : 0,
  flux_id : 15,
  user_id : 1,
  lots : [
    {
      inventory_uuid : '43F3DECBFCE9426E940AB2150E62186C',
      code : 'DDIS_IODP1S2_0',
      label : 'lot 1',
      quantity : 400,
      unit_cost : 1.46,
      lots : [],
      isValid : null,
      id : 0,
      uuid : 'E36AFF4F99C244A897B770E34A21E658',
      text : 'Polyvidone iodée, 10%, 200ml, flacon, Unité',
      _initialised : true,
      old_quantity : 1000,
      isExpired : false,
      oldQuantity : 1000,
      quantityAvailable : 1000,
    },
    {
      inventory_uuid : '43F3DECBFCE9426E940AB2150E62186C',
      code : 'DDIS_IODP1S2_0',
      label : 'lot 2',
      quantity : 600,
      unit_cost : 1.46,
      lots  : [],
      isValid  : null,
      id  : 1,
      uuid  : 'ACAA9876EF834D9F84E1BB7C2AF22777',
      text  : 'Polyvidone iodée, 10%, 200ml, flacon, Unité',
      _initialised  : true,
      old_quantity  : 1000,
      isExpired  : false,
      oldQuantity  : 1000,
      quantityAvailable  : 1000,
    },
    {
      inventory_uuid  : '43F3DECBFCE9940A426EE62186BC2150',
      code  : 'DDIS_IODP1S2_5',
      label  : 'PL1',
      quantity  : 400,
      unit_cost  : 9.51,
      lots  : [],
      isValid  : null,
      id  : 2,
      uuid  : 'D080D354417D47F18E8B1561E98823D9',
      text  : 'Polyvidone iodée, 10%, 500ml, flacon, Unité',
      _initialised  : true,
      old_quantity  : 1000,
      isExpired  : false,
      oldQuantity  : 1000,
      quantityAvailable  : 1000,
    }],
};

module.exports = {
  adjustmentPrevention,
  assetMot1,
  assetMot2,
  depotPrincipalMvt,
  depotPrincipalUuid,
  depotSecondaireUuid,
  enterpriseEntityUuid,
  flux,
  invalidAggregateMovement,
  lotQuinineUuid,
  lotVitamineA,
  movementComplexeAggregate,
  movementDepot,
  movementFirstLots,
  movementFromDonation,
  movementOutPatient,
  movementOverConsumptionAggregate,
  movementStandardAggregate,
  newEnterpriseAssign,
  newPersonAssign,
  newPersonAssign2,
  personEntityUuid,
  requisitionFromDepot,
  requisitionFromService,
  serviceAdministrationUuid,
};
