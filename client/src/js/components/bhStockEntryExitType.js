angular.module('bhima.components')
  .component('bhStockEntryExitType', {
    templateUrl : 'modules/templates/bhStockEntryExitType.tmpl.html',
    controller : StockEntryExitTypeController,
    bindings : {
      onEntryExitTypeSelectCallback : '&',
      selectedEntryExitType : '=',
      isEntry : '@',
      reference : '<?',
      displayName : '<?',
      depot : '<?',
      reset : '<?', // when changes to true the component will be reset
    },
  });

StockEntryExitTypeController.$inject = ['StockEntryExitTypeService'];

/**
 * Stock Entry Exit Type component
 * @param StockEntryExitTypes
 */
function StockEntryExitTypeController(StockEntryExitTypes) {
  const $ctrl = this;

  let isEntry;

  $ctrl.$onInit = function onInit() {
    isEntry = $ctrl.isEntry === 'true';

    reloadEntryExitTypes();
  };

  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.depot) {
      reloadEntryExitTypes();
    }

    if (changes.reset && changes.reset.currentValue) {
      reloadEntryExitTypes();
    }
  };

  $ctrl.getLabel = (type) => {
    if (!type) { return ''; }

    const hasDisplayLabel = (($ctrl.reference || $ctrl.displayName) && $ctrl.selectedEntryExitType)
      && type.label === $ctrl.selectedEntryExitType.label;

    if (hasDisplayLabel) {
      return $ctrl.display();
    }

    return type.descriptionKey;
  };

  $ctrl.display = () => {
    const list = [];

    if ($ctrl.isEntry === true) {
      return $ctrl.reference || '';
    }

    if ($ctrl.reference) {
      list.push($ctrl.reference);
    }

    if ($ctrl.displayName) {
      list.push($ctrl.displayName);
    }

    return list.join(' - ');
  };

  $ctrl.isTypeSelected = (type) => {
    return angular.equals(type.label, $ctrl.selectedEntryExitType?.label);
  };

  $ctrl.selectEntryExitType = (type) => {
    $ctrl.selectedEntryExitType = type;
    $ctrl.onEntryExitTypeSelectCallback({ type });
  };

  // reload entry/exit types
  /**
   *
   */
  function reloadEntryExitTypes() {
    $ctrl.selectedEntryExitType = {};

    if (!$ctrl.depot) { return; }

    let types;

    // source list depends on whether we are entering or exiting stock
    if (isEntry) {
      types = StockEntryExitTypes.entryTypes;
    } else {
      types = StockEntryExitTypes.exitTypes;
    }

    // get the final types by filtering on what is allowed in the depot
    $ctrl.types = types
      .filter(type => $ctrl.depot[type.allowedKey]);

    $ctrl.hasNoTypesDefined = $ctrl.types.length === 0;
  }
}
