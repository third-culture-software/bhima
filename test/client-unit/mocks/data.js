(() => {
  angular.module('bhima.mocks', [])
    .service('MockDataService', MockDataService);

  function MockDataService() {
    const service = this;

    service.cashboxes = () => [{
      id : 1,
      label : 'Little Cash Window',
      account_id : 1100,
      is_auxiliary : 1,
      transfer_account_id : 1200,
      symbol : '$ (USD)',
      currency_id : 1,
    }, {
      id : 2,
      label : 'Little Cash Window',
      account_id : 1101,
      is_auxiliary : 1,
      transfer_account_id : 1201,
      symbol : 'EUR',
      currency_id : 2,
    }, {
      id : 3,
      label : 'Main Coffre',
      account_id : 1102,
      is_auxiliary : 0,
      transfer_account_id : 1202,
      symbol : '$ (USD)',
      currency_id : 1,
    }, {
      id : 4,
      label : 'Secondary Coffre',
      account_id : 1103,
      is_auxiliary : 0,
      transfer_account_id : 1203,
      symbol : 'EUR',
      currency_id : 2,
    }];

    service.user = () => ({
      id : 1,
      username : 'admin',
      display_name : 'Administrator',
      password : 'superuser',
      email : 'admin@bhi.ma',
    });

    service.enterprise = () => ({
      id : 1,
      name : 'Test Enterprise',
      abbr : 'TE',
      location_id : '1f162a10-9f67-4788-9eff-c1fea42fcc9b',
      currency_id : 1,
      settings :  {},
    });

    service.exchange = () => [{
      // placeholder
    }, {
      currency_id : 1,
      name : 'FC',
      rate : 2000.0,
    }, {
      currency_id : 2,
      name : 'USD',
      rate : 1.0,
    }, {
      currency_id : 3,
      name : 'EUR',
      rate : 0.84,
    }];

    service.stock_settings = () => ({
      enterprise_id : 1,
      enable_auto_stock_accounting : 0,
    });

    service.project = () => ({
      id : 1,
      name : 'Test Project A',
      abbr : 'TPA',
      enterprise_id : 1,
    });

    service.services = () => [{
      uuid : 'B1816006555845F993A0C222B5EFA6CB',
      enterprise_id : 1,
      name : 'Administration',
    }, {
      uuid : 'AFF85BDCD7C64047AFE71724F8CD369E',
      enterprise_id : 1,
      name : 'Surgery',
    }, {
      uuid : 'E3988489EF6641DF88FA8B8ED6AA03AC',
      enterprise_id : 1,
      name : 'Internal Medicine',
    }];

    // purposely pluralized this to indicate it returns an array
    service.inventories = () => [{
      enterprise_id : 1,
      uuid : 'd03e7870-0c8e-47d4-a7a8-a17a9924b3f4',
      code : '100001',
      text : 'Acetazolamide 250mg',
      price : 0.8900,
      default_quantity : 1,
      group_uuid : '8d85a207-7c04-4d60-8891-fec7e5774b3d',
    }, {
      enterprise_id : 1,
      uuid : '5bcfb8b5-1ac0-49fa-8668-dad254a7de3d',
      code : '100044',
      text : 'Doxycyline 100mg',
      price : 0.0200,
      default_quantity : 20,
      group_uuid : '8d85a207-7c04-4d60-8891-fec7e5774b3d',
    }, {
      enterprise_id : 1,
      uuid : 'd2f7ef71-6f3e-44bd-8056-378c5ca26e20',
      code : '100070',
      text : 'Mefloquine 250mg',
      price : 0.9600,
      default_quantity : 10,
      group_uuid : '8d85a207-7c04-4d60-8891-fec7e5774b3d',
    }, {
      enterprise_id : 1,
      uuid : '43f3decb-fce9-426e-940a-bc2150e62186',
      code : '100102',
      text : 'Quinine sulphate 500mg',
      price : 0.1500,
      default_quantity : 8,
      group_uuid : '8d85a207-7c04-4d60-8891-fec7e5774b3d',
    }, {
      enterprise_id : 1,
      uuid : '1d9507a7-b6ce-4e80-b63a-ff10c6cda039',
      code : '120080',
      text : 'Coartem tab',
      price : 0.1397,
      default_quantity : 25,
      group_uuid : '8d85a207-7c04-4d60-8891-fec7e5774b3d',
    }, {
      enterprise_id : 1,
      uuid : 'b7d66f77-2f43-490f-a3fd-0feb3941ef4d',
      code : '100117',
      text : 'Vitamine B complex tab',
      price : 0.0100,
      default_quantity : 20,
      group_uuid : '8d85a207-7c04-4d60-8891-fec7e5774b3d',
    }];

    service.accounts = () => [{
      id : 0,
      label : 'Mock Root Account',
      type_id : 1,
      parent : null,
    }, {
      id : 1,
      label : 'Mock Account A',
      type_id : 2,
      parent : 0,
    }, {
      id : 2,
      label : 'Mock Account B',
      type_id : 2,
      parent : 0,
    }];

    service.patient = () => ({
      uuid : '274c51ae-efcc-4238-98c6-f402bfb39866',
      project_id : 1,
      account_id : 1350,
      debtor_uuid : '3be232f9-a4b9-4af6-984c-5d3f87d5c107',
      display_name : 'Test 2 Patient',
      dob : '1990-06-01 00:00:00',
      sex : 'M',
      barcode : 'PA81af634f',
      current_location_id : '1f162a10-9f67-4788-9eff-c1fea42fcc9b',
      debtor_group_name : 'Church Employees',
      debtor_group_uuid : '4de0fe47-177f-4d30-b95f-cff8166400b4',
      dob_unknown_date : 0,
      is_convention : 0,
      locked : 0,
      number : 41111010,
      origin_location_id : '1f162a10-9f67-4788-9eff-c1fea42fcc9b',
      price_list_uuid : '75e09694-dd5c-11e5-a8a2-6c29955775b0',
      reference : 'PA.TPA.1',
      registration_date : new Date(),
      hospital_no : '110',
    });

    service.priceLists = () => [{
      uuid : '274c51ae-efcc-4238-98c6-f402bfb39866',
      enterprise_id : 1,
      label : 'Test Price List A',
    }, {
      uuid : '3be232f9-a4b9-4af6-984c-5d3f87d5c107',
      enterprise_id : 1,
      label : 'Test Price List B',
    }];

    service.priceList = () => ({
      uuid : '75e09694-dd5c-11e5-a8a2-6c29955775b0',
      label : 'Test Price List',
      description : 'Price list for test purposes',
      items : [{
        uuid : '33942b06-162d-11e8-8587-000c296b3772',
        inventory_uuid : '1d9507a7-b6ce-4e80-b63a-ff10c6cda039',
        label : 'label 1',
        value : 100,
        is_percentage : 1,
      }, {
        uuid : '33943140-162d-11e8-8587-000c296b3772',
        inventory_uuid : 'd03e7870-0c8e-47d4-a7a8-a17a9924b3f4',
        label : 'label 2',
        value : 100,
        is_percentage : 1,
      }],
    });

    service.subsidies = () => [{
      subsidy_id : 1,
      label : 'Test Subsidy',
      description : 'Subsidy for test purposes',
      value : 50,
    }];

    service.invoicingFees = () => [{
      invoicing_fee_id : 1,
      label : 'Test Invoicing Fee',
      description : 'Example Invoicing Fee',
      value : 20,
    }, {
      invoicing_fee_id : 2,
      label : 'Second Test Invoicing Fee',
      description : 'Example Invoicing Fee 2',
      value : 10,
    }];
  }
})();
