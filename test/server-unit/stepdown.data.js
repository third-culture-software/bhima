const SAMPLE_5 = [
  {
    name : 'Daycare',
    principal : false,
    directCost : 50000,
    employees : 5,
    computers : 2,
    allocation : { method : 'proportional', field : 'employees' },
  },
  {
    name : 'HR',
    principal : false,
    directCost : 300000,
    employees : 4,
    computers : 5,
    allocation : { method : 'proportional', field : 'employees' },
  },
  {
    name : 'IT',
    principal : false,
    directCost : 200000,
    employees : 9,
    computers : 10,
    allocation : { method : 'proportional', field : 'computers' },
  },
  {
    name : 'Accounting',
    principal : false,
    directCost : 250000,
    employees : 8,
    computers : 10,
    allocation : { method : 'proportional', field : 'directCost' },
  },
  {
    name : 'Cuttings',
    principal : true,
    directCost : 500000,
    employees : 20,
    computers : 6,
  },
  {
    name : 'Assembling',
    principal : true,
    directCost : 700000,
    employees : 50,
    computers : 4,
  },
  {
    name : 'Packaging ',
    directCost : 400000,
    principal : true,
    employees : 5,
    computers : 8,
  },
];

/**
 *
 */
function exA4() {
  const Cadmin = 12000000;
  const Clab = 2000000;
  const Ctheater = 3000000;
  const Coutpat = 10000000;
  const Cwards = 35000000;

  return [
    {
      name : 'Administration',
      principal : false,
      directCost : Cadmin,
      labWork : 0,
      operations : 0,
      allocation : { method : 'proportional', field : 'directCost' },
    // ratio : [0, R1, R2, R3, R4],
    },
    {
      name : 'Laboratory',
      principal : false,
      directCost : Clab,
      labWork : 0,
      operations : 0,
      allocation : { method : 'proportional', field : 'labWork' },
    // ratio : [0, 0, R5, R6, R7],
    },
    {
      name : 'Theater',
      principal : false,
      directCost : Ctheater,
      labWork : 10,
      operations : 0,
      allocation : { method : 'proportional', field : 'operations' },
    // ratio : [0, 0, 0, R8, R9],
    },
    {
      name : 'Outpatient',
      principal : true,
      labWork : 50,
      directCost : Coutpat,
      operations : 20,
    },
    {
      name : 'Wards',
      principal : true,
      directCost : Cwards,
      labWork : 40,
      operations : 80,
    },
  ];
}

/**
 *
 */
function ex134() {
  return [
    {
      name : 'Laundry',
      principal : false,
      directCost : 15000,
      area : 50000,
      laundryVolume : 0,
      housekeepingHours : 150,
      allocation : { method : 'proportional', field : 'laundryVolume' },
    },
    {
      name : 'Housekeeping',
      principal : false,
      directCost : 30000,
      area : 0,
      laundryVolume : 5,
      housekeepingHours : 0,
      allocation : { method : 'proportional', field : 'housekeepingHours' },
    },
    {
      name : 'Radiology',
      principal : true,
      directCost : 135000,
      area : 10000,
      laundryVolume : 5,
      housekeepingHours : 900,
    },
    {
      name : 'Nursing ',
      principal : true,
      directCost : 170000,
      area : 140000,
      laundryVolume : 90,
      housekeepingHours : 1950,
    },
  ];
}

/**
 *
 */
function ex135() {
  return [
    {
      name : 'Housekeeping',
      principal : false,
      directCost : 30000,
      area : 0,
      laundryVolume : 5,
      housekeepingHours : 0,
      allocation : { method : 'proportional', field : 'housekeepingHours' },
    },
    {
      name : 'Laundry',
      principal : false,
      directCost : 15000,
      area : 50000,
      laundryVolume : 0,
      housekeepingHours : 150,
      allocation : { method : 'proportional', field : 'laundryVolume' },
    },
    {
      name : 'Radiology',
      principal : true,
      directCost : 135000,
      area : 10000,
      laundryVolume : 5,
      housekeepingHours : 900,
    },
    {
      name : 'Nursing',
      principal : true,
      directCost : 270000,
      area : 140000,
      laundryVolume : 90,
      housekeepingHours : 1950,
    },
  ];
}

/**
 *
 */
function ex136() {
  return [
    {
      name : 'Housekeeping',
      principal : false,
      directCost : 30000,
      area : 0,
      laundryVolume : 5,
      housekeepingHours : 0,
      allocation : { method : 'proportional', field : 'area' },
    },
    {
      name : 'Laundry',
      principal : false,
      directCost : 15000,
      area : 50000,
      laundryVolume : 0,
      housekeepingHours : 150,
      allocation : { method : 'proportional', field : 'laundryVolume' },
    },
    {
      name : 'Radiology',
      principal : true,
      directCost : 135000,
      area : 10000,
      laundryVolume : 5,
      housekeepingHours : 900,
    },
    {
      name : 'Nursing',
      directCost : 270000,
      principal : true,
      area : 140000,
      laundryVolume : 90,
      housekeepingHours : 1950,
    },
  ];
}

/**
 *
 */
function exDocumentation() {
  return [
    {
      name : 'Laundry',
      principal : false,
      directCost : 7000,
      area : 50,
      laundryVolume : 5,
      numEmployees : 2,
      allocation : { method : 'proportional', field : 'laundryVolume' },
    }, {
      name : 'Housekeeping',
      principal : false,
      directCost : 5000,
      area : 50,
      laundryVolume : 5,
      numEmployees : 2,
      allocation : { method : 'proportional', field : 'area' },
    }, {
      name : 'Administration',
      principal : false,
      directCost : 20000,
      area : 100,
      laundryVolume : 20,
      numEmployees : 2,
      allocation : { method : 'proportional', field : 'numEmployees' },
    }, {
      name : 'Surgery',
      directCost : 40000,
      principal : true,
      area : 100,
      laundryVolume : 40,
      numEmployees : 4,
    }, {
      name : 'Pharmacy',
      directCost : 100000,
      principal : true,
      area : 100,
      laundryVolume : 20,
      numEmployees : 2,
    },
  ];
}

/**
 *
 */
function allocationSample5() {
  return [
    [
      50000,
      2083.333333333333,
      4687.5,
      4166.666666666666,
      10416.666666666668,
      26041.666666666668,
      2604.166666666667,
    ],
    [
      0,
      302083.3333333333,
      29551.630434782608,
      26268.115942028984,
      65670.28985507246,
      164175.72463768115,
      16417.572463768116,
    ],
    [
      0,
      0,
      234239.1304347826,
      83656.83229813664,
      50194.09937888198,
      33462.73291925465,
      66925.4658385093,
    ],
    [
      0,
      0,
      0,
      364091.6149068322,
      113778.62965838506,
      159290.0815217391,
      91022.90372670806,
    ],
  ];
}

module.exports = {
  SAMPLE_5,
  SAMPLE_5_DISTRIBUTION : allocationSample5(),
  SAMPLE_A4 : exA4(),
  SAMPLE_13_4 : ex134(),
  SAMPLE_13_5 : ex135(),
  SAMPLE_13_6 : ex136(),
  SAMPLE_DOCS : exDocumentation(),
};
