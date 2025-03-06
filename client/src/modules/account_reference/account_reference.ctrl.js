angular.module('bhima.controllers')
  .controller('AccountReferenceController', AccountReferenceController);

AccountReferenceController.$inject = [
  '$state', 'AccountReferenceService', 'NotifyService', 'uiGridConstants',
  'LanguageService', '$translate', 'bhConstants',
];

/**
 * AccountReference Controller
 * This module is responsible for handling the CRUD operation on the account references
 */
function AccountReferenceController($state, AccountReferences, Notify, uiGridConstants,
  Language, $translate, bhConstants) {
  const vm = this;
  vm.gridApi = {};
  vm.filterEnabled = false;
  vm.toggleFilter = toggleFilter;
  vm.search = search;
  vm.onRemoveFilter = onRemoveFilter;
  vm.viewInAccountStatement = viewInAccountStatement;

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : [
      {
        field : 'abbr',
        displayName : 'ACCOUNT.REFERENCE.REFERENCE',
        headerCellFilter : 'translate',
        enableFiltering : true,
      },
      {
        field : 'accounts',
        displayName : 'ACCOUNT.REFERENCE.ACCOUNT_LIST',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/account_reference/templates/account_list.cell.html',
        enableFiltering : true,
      },
      {
        field : 'description',
        displayName : 'ACCOUNT.REFERENCE.DESCRIPTION',
        headerCellFilter : 'translate',
        width : '25%',
        enableFiltering : true,
      },
      {
        field : 'parent_abbr',
        displayName : 'ACCOUNT.REFERENCE.PARENT_REFERENCE',
        headerCellFilter : 'translate',
        headerCellClass : 'wrappingColHeader',
        enableFiltering : true,
      },
      {
        field : 'account_reference_type_label',
        displayName : 'FORM.LABELS.TYPE',
        width : '20%',
        headerCellFilter : 'translate',
        enableFiltering : true,
      },
      {
        field : 'cost_center',
        displayName : 'ACCOUNT.COST_CENTER',
        headerCellClass : 'wrappingColHeader',
        headerCellFilter : 'translate',
        enableFiltering : true,
      },
      {
        field : 'is_amo_dep',
        displayName : 'ACCOUNT.REFERENCE.AMO_DEP',
        headerTooltip : 'ACCOUNT.REFERENCE.AMO_DEP',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/account_reference/templates/is_amo_dep.cell.html',
        enableFiltering : true,
      },
      {
        field : 'action',
        displayName : '',
        cellTemplate : '/modules/account_reference/templates/action.cell.html',
        width : '15%',
        enableSorting : false,
        enableFiltering : false,
      },
    ],
  };

  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  function toggleFilter() {
    vm.filterEnabled = !vm.filterEnabled;
    vm.gridOptions.enableFiltering = vm.filterEnabled;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  // remove a filter with from the filter object, save the filters and reload
  function onRemoveFilter(key) {
    AccountReferences.removeFilter(key);
    AccountReferences.cacheFilters();
    vm.latestViewFilters = AccountReferences.filters.formatView();
    return loadGrid(AccountReferences.filters.formatHTTP(true));
  }

  // bind methods
  vm.edit = edit;
  vm.remove = remove;

  function edit(accountReference) {
    $state.go('account_reference.edit', { id : accountReference.id });
  }

  function remove(id) {
    AccountReferences.delete(id)
      .then(() => {
        Notify.success('ACCOUNT.REFERENCE.DELETED');
        loadGrid();
      })
      .catch(Notify.handleError);
  }

  function search() {
    const filtersSnapshot = AccountReferences.filters.formatHTTP();

    AccountReferences.openSearchModal(filtersSnapshot)
      .then((changes) => {
        if (!changes) { return null; }

        AccountReferences.filters.replaceFilters(changes);

        AccountReferences.cacheFilters();
        vm.latestViewFilters = AccountReferences.filters.formatView();

        return loadGrid(AccountReferences.filters.formatHTTP(true));
      });
  }

  function handleError(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  // load user grid
  function loadGrid(parameters) {
    toggleLoadingIndicator();
    vm.hasError = false;

    if ($state.params.filters.length) {
      AccountReferences.filters.replaceFiltersFromState($state.params.filters);
      AccountReferences.cacheFilters();
    }

    vm.latestViewFilters = AccountReferences.filters.formatView();
    const filterSearch = parameters || AccountReferences.filters.formatHTTP(true);

    // Insert the languae into the filters
    filterSearch.lang = Language.key;

    AccountReferences.read(null, filterSearch)
      .then((references) => {
        references.forEach((item) => {
          item.account_reference_type_label = $translate.instant(item.account_reference_type_label);
        });

        vm.gridOptions.data = references;
      })
      .catch(handleError)
      .finally(toggleLoadingIndicator);
  }

  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  const isNotTitleAccount = account => account.account_type_id !== bhConstants.accounts.TITLE;

  function viewInAccountStatement(abbr) {
    return AccountReferences.getAccountsForReference(abbr)
      .then(list => {
        const accountIds = list
          .filter(account => (isNotTitleAccount(account) && !account.hidden))
          .map(account => account.account_id);

        return $state.go('reportsBase.account_report_multiple', { data : { accountIds } });
      })
      .catch(Notify.handleError);
  }

  loadGrid();
}
