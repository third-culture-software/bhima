angular.module('bhima.directives')
  .directive('uiGridEditAccount', uiGridEditAccount);

uiGridEditAccount.$inject = ['uiGridEditConstants', 'AccountService', 'uiGridConstants', '$timeout'];

/**
 *
 * @param uiGridEditConstants
 * @param Accounts
 * @param uiGridConstants
 * @param $timeout
 */
function uiGridEditAccount(uiGridEditConstants, Accounts, uiGridConstants, $timeout) {
  return {
    restrict : 'A',
    template() {
      return `
<div style="display: table; margin-right: auto; margin-left: auto; width:95%">'
  <input type="text" autofocus '
    style="width:100%" '
    ng-model="accountInputValue" '
    uib-typeahead="account.id as account.hrlabel for account in accounts | filter:{'hrlabel':$viewValue} | limitTo:8" '
    typeahead-min-length="1" '
    typeahead-editable ="false" '
    typeahead-append-to-body="true" '
    typeahead-on-select="setAccountOnRow(row.entity, $item)" />'
</div>`;
    },
    require : ['?^uiGrid', '?^uiGridRenderContainer'],
    scope   : true,
    compile() {
      return {
        post($scope, $elm, $attrs, controllers) {
          const uiGridCtrl = controllers[0];
          const renderContainerCtrl = controllers[1];

          Accounts.read()
            .then((accounts) => {
              $scope.accounts = Accounts.filterTitleAccounts(accounts);
            });

          // checks to see if a click landed in a dropdown menu - if so, it's probably the typeahead's.
          // if not, it is external and we should end the edit session
          const onWindowClick = function (evt) {
            const classNamed = angular.element(evt.target).attr('class');
            if (classNamed) {
              const isAccountTypeaheadElement = (classNamed.indexOf('dropdown-menu') > -1);
              if (!isAccountTypeaheadElement && evt.target.nodeName !== 'INPUT') {
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

          $scope.stopEdit = function stopEdit() {
            $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
          };

          $scope.$on('$destroy', () => {
            angular.element(window).off('click', onWindowClick);
          });

          $scope.setAccountOnRow = function setAccountOnRow(row, account) {
            row.account_id = account.id;
            row.account_name = account.label;
            row.account_number = account.number;
            row.account_label = account.label;
            row.account_type_id = account.type_id;
          };

          $scope.$on(uiGridEditConstants.events.BEGIN_CELL_EDIT, () => {
            $scope.accountInputValue = '';

            if (uiGridCtrl.grid.api.cellNav) {
              uiGridCtrl.grid.api.cellNav.on.navigate($scope, (/* newRowCol, oldRowCol */) => { $scope.stopEdit(); });
            } else {
              angular.element(document.querySelectorAll('.ui-grid-cell-contents')).on('click', onCellClick);
            }

            $timeout(focusTypeaheadInput, 50);
            angular.element(window).on('click', onWindowClick);
          });

          /**
           *
           */
          function focusTypeaheadInput() {
            const $input = $elm.querySelectorAll('input')[0];
            $input.focus();
          }

          $elm.on('keydown', (evt) => {
            switch (evt.keyCode) {  
            case uiGridConstants.keymap.ESC:
              evt.stopPropagation();
              $scope.$emit(uiGridEditConstants.events.CANCEL_CELL_EDIT);
              break;
            }

            if (uiGridCtrl && uiGridCtrl.grid.api.cellNav) {
              evt.uiGridTargetRenderContainerId = renderContainerCtrl.containerId;
              if (uiGridCtrl.cellNav.handleKeyDown(evt) !== null) {
                $scope.stopEdit(evt);
              }
            } else {
              switch (evt.keyCode) {   
              case uiGridConstants.keymap.ENTER:
              case uiGridConstants.keymap.TAB:
                evt.stopPropagation();
                evt.preventDefault();
                $scope.stopEdit(evt);
                break;
              }
            }
            return true;
          });
        },
      };
    },
  };
}
