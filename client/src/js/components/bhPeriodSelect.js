angular.module('bhima.components')
  .component('bhPeriodSelect', {
    bindings : {
      defaultPeriod : '@',
      onSelectCallback : '&',
      label  : '@?',
    },
    templateUrl : 'modules/templates/bhPeriodSelect.tmpl.html',
    controller : PeriodSelect,
  });

PeriodSelect.$inject = ['PeriodService', 'bhConstants'];

/**
 *
 * @param Periods
 * @param bhConstants
 */
function PeriodSelect(Periods, bhConstants) {
  const ctrl = this;
  const DEFAULT_PERIOD = 'today';

  ctrl.NO_PERIOD_LIMIT_KEY = 'allTime';
  ctrl.CUSTOM_PERIOD_KEY = 'custom';

  ctrl.expanded = false;
  ctrl.customExpanded = false;

  ctrl.Periods = Periods;

  ctrl.customSelection = {
    from : new Date(),
    to : new Date(),
  };

  ctrl.dateFormat = bhConstants.dates.format;

  ctrl.$onInit = function onInit() {
    ctrl.label = ctrl.label || 'FORM.LABELS.PERIOD';
    ctrl.periodKey = ctrl.defaultPeriod || DEFAULT_PERIOD;
    ctrl.period = Periods.definition(ctrl.periodKey);

    // if custom is already defined, use it
    if (ctrl.periodKey === ctrl.CUSTOM_PERIOD_KEY) {
      ctrl.customSelection.from = ctrl.period.customPeriodStart || new Date();
      ctrl.customSelection.to = ctrl.period.customPeriodEnd || new Date();
    }
  };

  ctrl.toggleSelectionOptions = function toggleSelectionOptions() {
    ctrl.expanded = !ctrl.expanded;
  };

  ctrl.toggleCustomSelection = function toggleCustomSelection() {
    ctrl.customExpanded = !ctrl.customExpanded;

    if (ctrl.customExpanded) {
      // we consider the custom dates as the current period
      ctrl.customPeriodChanges();
    } else {
      /*
        when the user closes the custom dates (from and to)
        we select the default period, and we should not close the select period area
        ( ctrl.expanded should remain true,
        so we add a new parameter 'togglable' in this function ctrl.selectPeriod
      */
      ctrl.selectPeriod(ctrl.NO_PERIOD_LIMIT_KEY, true);
    }
  };

  ctrl.selectPeriod = function selectPeriod(key, togglable) {
    const period = Periods.definition(key);
    ctrl.onSelectCallback({ period });
    // should not toggle in custom mode , as explained in at this point : ctrl.toggleCustomSelection()
    if (!togglable) {
      ctrl.toggleSelectionOptions();
    }

    ctrl.period = period;
  };

  // custom dates changed, current period should be updated
  ctrl.customPeriodChanges = () => {
    const _period = Periods.index.custom;
    _period.customPeriodStart = ctrl.customSelection.from;
    _period.customPeriodEnd = ctrl.customSelection.to;
    ctrl.onSelectCallback({ period : _period });
  };

  ctrl.selectCustomPeriod = function selectCustomPeriod(selection) {
    const period = Periods.index.custom;

    // alias start and end;
    period.customPeriodStart = selection.from;
    period.customPeriodEnd = selection.to;

    ctrl.onSelectCallback({ period });
    ctrl.toggleSelectionOptions();

    ctrl.period = period;
  };
}
