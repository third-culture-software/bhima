angular.module('bhima.components')
  .component('bhReportSource', {
    bindings : {
      onSelectCallback : '&',
      label : '@?',
      name : '@?',

      // allows the controller to set a default value
      value : '<',
    },
    template :
    `<div class="form-group" bh-report-source>
      <label class="control-label" translate>{{$ctrl.label}}</span></label>
      <select 
        ng-change="$ctrl.onSelect($ctrl.value)"
        class="form-control"
        ng-model="$ctrl.value"
        ng-options="source.id as (source.label | translate) for source in $ctrl.sources"
        required>
      <option value="" disabled translate>FORM.SELECT.SOURCE</option>
      </select>
      {{$ctrl.invalue}}
    </div>`,
    controller : bhReportSourceController,
  });

bhReportSourceController.$inject = [];

function bhReportSourceController() {
  const ctrl = this;
  const DEFAULT_SOURCE = 1;

  /* @const */
  ctrl.sources = [
    { id : 1, label : 'FORM.LABELS.GENERAL_LEDGER' },
    { id : 2, label : 'FORM.LABELS.POSTING_JOURNAL' },
    { id : 3, label : 'FORM.LABELS.ALL' },
  ];

  ctrl.$onInit = function $onInit() {
    ctrl.label = ctrl.label || 'FORM.SELECT.SOURCE';
    ctrl.name = ctrl.name || 'source';

    // select default value if nothing is selected
    if (angular.isUndefined(ctrl.value)) {
      ctrl.onSelect(DEFAULT_SOURCE);
    }
  };

  ctrl.onSelect = function onSelect($item) {
    ctrl.onSelectCallback({ source : $item });
  };
}
