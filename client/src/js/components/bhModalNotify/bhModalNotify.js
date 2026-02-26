angular.module('bhima.components')
  .component('bhModalNotify', {
    templateUrl : 'js/components/bhModalNotify/bhModalNotify.html',
    controller  : ModalNotifyController,
    bindings    : {
      value : '<?',
      type : '@?',
      error : '<?',
      ttl : '<?',
    },
  });

ModalNotifyController.$inject = ['$timeout'];

/**
 *
 * @param $timeout
 */
function ModalNotifyController($timeout) {
  const $ctrl = this;
  const DEFAULT_TTL = 3000;
  const ERR_TTL = 50000;
  let timer;

  const options = {
    success : 'notification-success',
    danger  : 'notification-danger',
    info    : 'notification-info',
    warn    : 'notification-warn',
    error   : 'notification-error',
  };

  /**
   *
   * @param error
   */
  function handleError(error) {
    if (error.data && error.data.code) {
      setNotification(error.data.code, ERR_TTL);
    }
  }

  /**
   *
   * @param key
   * @param ttl
   */
  function setNotification(key, ttl) {
    const errorFormat = options.error;
    const otherFormat = options[$ctrl.type || 'info'];
    $ctrl.message = key;
    $ctrl.style = $ctrl.error ? errorFormat : otherFormat;
    $ctrl.visible = true;

    timer = $timeout(() => {
      $ctrl.visible = false;
    }, ttl);
  }

  $ctrl.close = () => {
    $timeout.cancel(timer);
    $ctrl.visible = false;
  };

  $ctrl.$onChanges = (changes) => {
    if (changes.value && changes.value.currentValue) {
      setNotification(changes.value.currentValue, $ctrl.ttl || DEFAULT_TTL);
    }

    if (changes.error && changes.error.currentValue) {
      handleError(changes.error.currentValue);
    }
  };
}
