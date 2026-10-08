angular.module('bhima.components')
  .component('bhClear', {
    template : `
      <span style="display:inline-block;" class="pull-right">
        <a data-reset-input href ng-click="$ctrl.onClear()" tabindex="-1">
          <i class="fa fa-eraser"></i> <span translate>FORM.BUTTONS.CLEAR</span>
        </a>
      </span>`,
    bindings : { onClear : '&' },
  });
