angular.module('bhima.controllers')
  .controller('InventoryLogModalController', InventoryLogModalController);

InventoryLogModalController.$inject = [
  'data', '$uibModalInstance', 'InventoryService', 'LanguageService',
];

/**
 *
 * @param data
 * @param Instance
 * @param Inventory
 * @param LanguageService
 */
function InventoryLogModalController(data, Instance, Inventory, LanguageService) {
  const vm = this;
  vm.close = Instance.close;
  vm.lang = LanguageService.key;
  Inventory.read(data.uuid).then(inventory => {
    vm.inventory = inventory;
  });

  Inventory.inventoryLog(data.uuid)
    .then(logs => {
      vm.logs = [];
      logs.forEach(log => {
        const { action, last, current } = JSON.parse(log.text);
        formatKeys(last);
        formatKeys(current);

        if (action === 'CREATION') {
          vm.logs.push({
            value : 'FORM.INFO.CREATED',
            date : log.log_timestamp,
            userName :  log.userName,
          });
        } else {
          const updatedKeys = Object.keys(current);
          updatedKeys.forEach(col => {
            if (col === 'tags') {
              const oldTags = last[col];
              const newTags = current[col];
              if (oldTags.length === newTags.length) {
                if (newTags.length === 0) {
                  return;
                }
                if (JSON.stringify(oldTags) === JSON.stringify(newTags)) {
                  return;
                }
              }
            }
            vm.logs.push({
              col : Inventory.columnsMap(col),
              value : getValue(last, current, col),
              date : log.log_timestamp,
              userName : log.userName,
              update : true,
            });
          });
        }
      });

    });

  /**
   *
   * @param record
   */
  function formatKeys(record) {
    const removables = ['group_uuid', 'type_id', 'unit_id'];
    removables.forEach(r => {
      delete record[r];
    });
    if (record.label) {
      record.text = record.label;
    }
    return record;
  }

  /**
   *
   * @param last
   * @param current
   * @param key
   */
  function getValue(last, current, key) {
    const result = {};

    if (key === 'tags') {
      result.from = last.tags.map(tag => tag.name) || [];
      result.to = current.tags.map(tag => tag.name) || [];
      return result;
    }

    if (key === 'inventoryGroup') {
      result.from = last.groupName || '';
      result.to = current.inventoryGroup.name || '';
      return result;
    }

    if (key === 'inventoryType') {
      result.from = last.type;
      result.to = current.inventoryType.text;
      return result;
    }

    if (key === 'inventoryUnit') {
      result.from = last.unit_type;
      result.to = current.inventoryUnit.unit_type;
      return result;
    }

    result.from = last[key];
    result.to = current[key];
    return result;
  }

}
