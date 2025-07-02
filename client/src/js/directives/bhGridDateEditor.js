/** originally forked from https://github.com/Joiler/ui-grid-edit-datepicker */

angular.module('ui.grid.edit')
  .directive('uiGridEditDatepicker', uiGridEditDatePicker);

uiGridEditDatePicker.$inject = [
  '$timeout', 'uiGridConstants', 'uiGridEditConstants',
];

/**
 * @class uiGridEditDatePicker
 *
 * @description
 * This directive implements a datepicker editor for angular's ui-grid.
 */
function uiGridEditDatePicker($timeout, uiGridConstants, uiGridEditConstants) {
  return {
    template : `
      <input 
         class="form-control" 
        type="text" 
        uib-datepicker-popup 
        datepicker-options="datepickerOptions" 
        datepicker-append-to-body="true"  
        show-button-bar="false" 
        is-open="isOpen" 
        ng-model="datePickerValue" 
        ng-change="changeDate($event)"/>`,
    require : ['?^uiGrid', '?^uiGridRenderContainer'],
    scope : true,
    compile() {
      return {
        post($scope, $elm, $attrs, controllers) {

          // the original datepicker values
          // const originalValue = new Date($scope.row.entity[$scope.col.field]);

          // bind datePickerValue to the correct value
          $scope.datePickerValue = new Date($scope.row.entity[$scope.col.field]);
          $scope.isOpen = true;
          $scope.datepickerOptions = { initDate : new Date() };

          const uiGridCtrl = controllers[0];
          const renderContainerCtrl = controllers[1];

          const onWindowClick = function (evt) {
            const classNamed = angular.element(evt.target).attr('class');
            if (classNamed) {
              const inDatepicker = (classNamed.indexOf('datepicker-calendar') > -1);
              if (!inDatepicker && evt.target.nodeName !== 'INPUT') {
                $scope.stopEdit(evt);
              }
            } else {
              $scope.stopEdit(evt);
            }
          };

          const onCellClick = function (evt) {
            angular.element(document.querySelectorAll('.ui-grid-cell-contents')).off('click', onCellClick);
            $scope.stopEdit(evt);
          };

          // @todo - make sure this actually gets cleaned up when $scope is destroyed!
          uiGridCtrl.grid.api.edit.on.cancelCellEdit($scope, () => { $scope.stopEdit(); });

          $scope.$on(uiGridEditConstants.events.BEGIN_CELL_EDIT, () => {
            if (uiGridCtrl.grid.api.cellNav) {
              uiGridCtrl.grid.api.cellNav.on.navigate($scope, () => { $scope.stopEdit(); });
            } else {
              angular.element(document.querySelectorAll('.ui-grid-cell-contents')).on('click', onCellClick);
            }

            angular.element(window).on('click', onWindowClick);
          });

          $scope.stopEdit = () => {
            $scope.row.entity[$scope.col.field] = $scope.datePickerValue;
            $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
          };

          // Make sure that the edit is canceled on the ESC key.  The event is not
          // propogated by uib-datepicker-popup.
          // See: https://github.com/angular-ui/bootstrap/commit/000d6c309e7c2065576d535feaf6868ac06b75d0
          $scope.$watch('isOpen', (isOpen) => {
            if (!isOpen) {
              $timeout($scope.stopEdit, 0, false);
            }
          });

          // make sure we quit when we need to.
          function handleKeydown(evt) {
            if (uiGridCtrl && uiGridCtrl.grid.api.cellNav) {
              evt.uiGridTargetRenderContainerId = renderContainerCtrl.containerId;
              if (uiGridCtrl.cellNav.handleKeyDown(evt) !== null) {
                $scope.stopEdit(evt);
              }
            } else {
              switch (evt.keyCode) { // eslint-disable-line 
              case uiGridConstants.keymap.ENTER:
              case uiGridConstants.keymap.TAB:
                evt.stopPropagation();
                evt.preventDefault();
                $scope.stopEdit(evt);
                break;
              }
            }

            return true;
          }

          $elm.on('keydown', handleKeydown);

          $scope.$on('$destroy', () => {
            angular.element(window).off('click', onWindowClick);
            $('body > .dropdown-menu').remove();
            $elm.off('keydown', handleKeydown);
          });
        },
      };
    },
  };
}
