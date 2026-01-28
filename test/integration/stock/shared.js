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

let formatedMonth = getMovementMonthComplexe + 1;

if (formatedMonth < 10) {
  formatedMonth = `0${formatedMonth}`;
}



module.exports = {
  assetMot1,
  assetMot2,
  depotPrincipalMvt,
  depotPrincipalUuid,
  depotSecondaireUuid,
  enterpriseEntityUuid,
  flux,
  lotQuinineUuid,
  lotVitamineA,
  movementDepot,
  movementFirstLots,
  movementFromDonation,
  movementOutPatient,
  newEnterpriseAssign,
  newPersonAssign,
  newPersonAssign2,
  personEntityUuid,
  requisitionFromDepot,
  requisitionFromService,
  serviceAdministrationUuid,
};
