angular.module('bhima.components')
  .component('bhReportSource', {
    bindings : {
      onSelectCallback : '&',
      label : '@?',
      name : '@?',
      value : '<?',
    },
    template :
    `<div class="form-group">
      <label class="control-label" for="{{$ctrl.name}}" translate>{{$ctrl.label}}</label>
      <select
        id="{{$ctrl.name}}"
        name="{{$ctrl.name}}"
        class="form-control"
        ng-model="$ctrl.value"
        ng-change="$ctrl.onSelect($ctrl.value)"
        ng-options="source.id as (source.label | translate) for source in $ctrl.sources"
        required>
        <option value="" disabled translate>FORM.SELECT.SOURCE</option>
      </select>
    </div>`,
    controller : bhReportSourceController,
  });


/**
 * bhReportSource Component
 *
 * Select box for choosing the data source of a report
 * (general ledger, posting journal, or both).
 * @example
 * <bh-report-source
 *   value="vm.source"
 *   on-select-callback="vm.onSelectSource(source)">
 * </bh-report-source>
 */
function bhReportSourceController() {
  const ctrl = this;

  const DEFAULT_SOURCE = 1;

  const REPORT_SOURCES = Object.freeze([
    { id : 1, label : 'FORM.LABELS.GENERAL_LEDGER' },
    { id : 2, label : 'FORM.LABELS.POSTING_JOURNAL' },
    { id : 3, label : 'FORM.LABELS.ALL' },
  ]);

  ctrl.sources = REPORT_SOURCES;

  ctrl.$onInit = function $onInit() {
    ctrl.label = ctrl.label || 'FORM.SELECT.SOURCE';
    ctrl.name = ctrl.name || 'source';

    // select the default value if nothing was provided
    if (angular.isUndefined(ctrl.value) || ctrl.value === null) {
      ctrl.value = DEFAULT_SOURCE;
      ctrl.onSelect(ctrl.value);
    }
  };

  ctrl.onSelect = function onSelect(source) {
    ctrl.onSelectCallback({ source });
  };
}
