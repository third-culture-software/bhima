angular.module('bhima.components')
  .component('bhCardList', {
    templateUrl : 'modules/templates/bhCardList.tmpl.html',
    controller : bhCardList,
    bindings : {
      data : '<',
      template : '@',
      sortName : '@', // name attribute to be sorted alphabetically and filtered
      sortAge : '@?', // date attribute to be sorted by date
      sortSize : '@?', // size attribute to be sorted largest to smallest
      id : '@?', // optional data override
    }
    ,
  });

/**
 * @description
 * Component for displaying cards of information, providing sorting and filtering
 * functionality.
 *
 * Requires:
 * `data` : the array to iterate over
 * `sort-name` : the entity display name that should be sorted and filtered
 * `template` : path to an HTML template that should be displayed for each element
 *
 * Optional:
 * `sort-age` : the entity date field key, this will allow it to be sorted by age
 * `sort-size` : the entity size field key, this will allow it to be sorted by largest
 * `id` : provide a custom entity identifier override
 */
function bhCardList() {
  const $ctrl = this;

  // name, age and size options will be added to this _if_ they are defined
  // through bindings
  $ctrl.orderOptions = { active : false, available : [] };
  $ctrl.filterOptions = { active : false, value : {} };

  $ctrl.$onInit = function onInit() {
    $ctrl.identifier = $ctrl.id;

    assignAvailableOrders($ctrl.sortName, $ctrl.sortAge, $ctrl.sortSize);
  };

  $ctrl.$onChanges = function onChanges(changes) {
    if (changes.data && angular.isDefined(changes.data.currentValue)) {
      if (!$ctrl.identifier) {
        // no identifier override found
        $ctrl.identifier = defaultIdentifier(changes.data.currentValue);
      }
    }
  };

  $ctrl.toggleFilter = function toggleFilter() {
    $ctrl.filterOptions.value = '';
    $ctrl.filterOptions.active = !$ctrl.filterOptions.active;
  };

  $ctrl.setOrder = function setOrder(order) {
    $ctrl.orderOptions.active = angular.isDefined(order);
    $ctrl.orderOptions.current = order || $ctrl.orderOptions.defaultOrder;
  };

  // attempt to pick an identifier based on common ids
  // this is overriden by binding a specific `id`
  // supported default identifiers are 'id' and 'uuid'
  function defaultIdentifier(data) {
    const sampleData = data[0] || {};
    return angular.isDefined(sampleData.uuid) ? 'uuid' : 'id';
  }

  function assignAvailableOrders(name, age, size) {
    // name binding is required - assume this is valid
    $ctrl.orderOptions.available.push(
      { attribute : name, key : 'TABLE.COLUMNS.SORTING.NAME_ASC', reverse : false },
      { attribute : name, key : 'TABLE.COLUMNS.SORTING.NAME_DESC', reverse : true },
    );

    // parse optional bindings
    if (angular.isDefined(age)) {
      $ctrl.orderOptions.available.push(
        { attribute : age, key : 'TABLE.COLUMNS.SORTING.CREATED_ASC', reverse : false },
        { attribute : age, key : 'TABLE.COLUMNS.SORTING.CREATED_DESC', reverse : true },
      );
    }

    if (angular.isDefined(size)) {
      $ctrl.orderOptions.available.push(
        { attribute : size, key : 'TABLE.COLUMNS.SORTING.TOTAL_ASC', reverse : true },
      );
    }

    // default orders - default to the first order
    [$ctrl.orderOptions.defaultOrder] = $ctrl.orderOptions.available;
    $ctrl.orderOptions.current = $ctrl.orderOptions.defaultOrder;
  }
}
