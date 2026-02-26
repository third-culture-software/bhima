/* eslint no-useless-escape:off */
angular.module('bhima.services')
  .service('PasswordMeterService', PasswordMeterService);

PasswordMeterService.$inject = ['SessionService'];

/**
 *
 * @param Session
 */
function PasswordMeterService(Session) {
  const service = this;

  service.validate = validate;
  service.counter = counter;

  // A strong password must include special characters
  const STRONG_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;

  // A medium strength password includes only numbers and letters
  const MEDIUM_REGEX = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/;

  /**
   * @param viewValue
   * @function validate
   * @description
   * Transforms a password string into a true/false validation to check if it is
   * strong enough.  If password validation is turned off, it always returns
   * true.  Otherwise, it will return true only for medium or strong passwords
   * and false in all other cases.
   * @returns {boolean} valid - true/false depending on if the password is valid
   */
  function validate(viewValue) {

    // escape the validation if we don't need to validate passwords
    if (Session.enterprise && !Session.enterprise.settings.enable_password_validation) {
      return true;
    }

    if (STRONG_REGEX.test(viewValue)) {
      // Strong password
      return true;
    } if (MEDIUM_REGEX.test(viewValue)) {
      // Medium password
      return true;
    }

    // Weak password
    return false;

  }

  /**
   * @param viewValue
   * @function counter
   * @description
   * Transforms a password string into a rating from -1 to 4.  If the password
   * is undefined, it returns -1. Otherwise, it returns a scale up to 4.
   * @returns {number} strength - -1 - 4 depending on the password strength
   */
  function counter(viewValue) {
    if (!viewValue) {
      return -1;
    }

    if (viewValue.toString().length < 8) {
      // Weak password
      return 0;
    } if (STRONG_REGEX.test(viewValue)) {
      // strong password
      return 4;
    } if (MEDIUM_REGEX.test(viewValue)) {
      // Medium password
      return 3;
    }

    return 0;
  }
}
