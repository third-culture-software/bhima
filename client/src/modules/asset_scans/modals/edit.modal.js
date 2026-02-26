angular.module('bhima.controllers')
  .controller('AssetScanEditModalController', AssetScanEditModalController);

// dependencies injections
AssetScanEditModalController.$inject = [
  'data',
  'StockService', 'AssetsScanService', 'SessionService', 'NotifyService', '$uibModalInstance',
];

/**
 *
 * @param Data
 * @param Stock
 * @param AssetScans
 * @param Session
 * @param Notify
 * @param Instance
 */
function AssetScanEditModalController(Data,
  Stock, AssetScans, Session, Notify, Instance) {

  const vm = this;

  vm.loading = false;

  vm.model = {};

  vm.enterprise = Session.enterprise;

  vm.cancel = Instance.close;

  vm.submit = submit;

  vm.clear = key => {
    delete vm.model[key];
  };

  vm.onSelectDepot = (depot) => {
    vm.model.depot_uuid = depot.uuid;
  };

  vm.onSelectScannedBy = (user) => {
    vm.model.scanned_by = user.id;
  };

  vm.onSelectCondition = (cond) => {
    vm.model.condition_id = cond.id;
  };

  /**
   *
   */
  function startup() {
    vm.loading = true;

    if (Data.uuid) {
      AssetScans.details(Data.uuid)
        .then(scan => {
          vm.model = scan;
        })
        .catch(Notify.handleError)
        .finally(() => {
          vm.loading = false;
        });
    } else {
      Stock.assets.getAssetLots({ lot_uuid : Data.asset_uuid })
        .then(assets => {
          const asset = assets[0];

          // return AssetsScans.getLastScan({ asset_uuid : assets[0].uuid });
          vm.model = {
            asset_uuid : asset.uuid,
            asset_label : asset.label,
            inventory_code : asset.inventory_code,
            depot_uuid : asset.depot_uuid,
            depot_text : asset.depot_text,

            manufacturer_brand : asset.manufacturer_brand,
            manufacturer_model : asset.manufacturer_model,
            serial_number : asset.serial_number,

            scanned_by : Session.user.id,
          };
          // Get the last scan for this asset so we can set the correct condition
          return AssetScans.getLastScan(asset.uuid);
        })
        .then(scan => {
          vm.model.condition_id = scan.condition_id || 1;
        })
        .catch(Notify.handleError)
        .finally(() => {
          vm.loading = false;
        });
    }
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) { return 0; }

    if (vm.model.uuid) {
      return AssetScans.update(Data.uuid, vm.model)
        .then(() => {
          Instance.close(true);
          Notify.success('ASSET.SCAN_EDITED');
        })
        .catch(Notify.handleError);
    }

    return AssetScans.create(vm.model)
      .then(() => {
        // Ignore new UUID return value
        Instance.close(true);
        Notify.success('ASSET.SCAN_CREATED');
      })
      .catch(Notify.handleError);
  }

  startup();
}
