angular.module('bhima.services')
  .service('util', UtilService);

UtilService.$inject = ['moment'];

/**
 * @param moment
 * @class util
 * @description
 * Common utilities for the application
 * @requires moment
 */
function UtilService(moment) {
   
  const service = this;

  service.unwrapHttpResponse = function unwrapHttpResponse(response) {
    return response.data;
  };

  service.formatDate = (date, format) => {
    const f = format || 'DD/MM/YYYY HH:mm:ss';
    if (date) {
      return moment(date).format(f);
    }
    return null;
  };

  /**
   * @param array
   * @param prop
   * @function getUniqueBy
   * @description
   * A function that filters an array of objects by a unique
   * property in those objects.  Analogous to lodash's _.uniqBy()
   */
  service.getUniqueBy = function getUniqueBy(array, prop) {
    const set = new Set();
    return array.filter(o => !set.has(o[prop]) && set.add(o[prop]));
  };

  service.download = (response, filename, extension) => {
    const hiddenElement = document.createElement('a');
    const hasFileInfo = (filename && extension);
    const attachment = hasFileInfo ? 'data:attachment/'.concat(extension, ',') : 'data:attachment/text,';
    const name = hasFileInfo ? filename.concat('.', extension) : 'file.txt';

    hiddenElement.href = attachment.concat(encodeURI(response.data));
    hiddenElement.target = '_blank';
    hiddenElement.download = name;
    hiddenElement.click();
  };

  /**
   * @param formDefinition
   * @param requireDirty
   * @todo comments showing usage
   */
  service.filterFormElements = function filterFormElements(formDefinition, requireDirty) {
    const response = {};

    angular.forEach(formDefinition, (value, key) => {

      // Determine angular elements, these can be ignored
      const isAngularAttribute = key.substring(0, 1) === '$';

      if (!isAngularAttribute) {

        // Only format and assign dirty values that have changed
        if (requireDirty && !value.$dirty) {
          return;
        }

        // any standard ng-model element will provide an $modelValue, according
        // to the latest 2.x standards more complex bhima components or bhima
        // component wrappers will expose $bhValue

        // accounts for empty string values
        response[key] = angular.isDefined(value.$modelValue) ? value.$modelValue : value.$bhValue;
      }
    });
    return response;
  };

  // Define the minimum date for any patient data
  service.defaultBirthMonth = '06-01';

  // Define the maxLength By Value
  service.length250 = 250;
  service.length200 = 200;
  service.length150 = 150;
  service.length100 = 100;
  service.length70 = 70;
  service.length50 = 50;
  service.length40 = 40;
  service.length30 = 30;
  service.length20 = 20;
  service.length16 = 16;
  service.length12 = 12;

  // utility function
  service.clean = function clean(o) {
    // clean off the $$hashKey and other angular bits and delete undefined
    const cleaned = {};

    Object.keys(o).forEach(k => {
      if (k !== '$$hashKey' && angular.isDefined(o[k]) && o[k] !== '' && o[k] !== null) {
        cleaned[k] = o[k];
      }
    });

    return cleaned;
  };

  // moment() provides the current date, similar to the new Date() API. This requests the difference between two dates
  service.getMomentAge = (date, duration) => {
    return duration ? moment().diff(date, duration) : moment().diff(date);
  };

  /**
   * @function once
   * @description
   * Ensure that a function only executes once.  Allows the caller to pass in a
   * context to inject into `this`.
   * @param {Function} fn - the function to only call once.
   * @param {object} context - sets the `this` variable in the called function
   */
  service.once = function once(fn, context) {
    let result;

    return function out() {
      if (!fn) {
        return null;
      }

      // call the function only once
      result = fn.apply(context || this, arguments);
       
      fn = null;

      return result;
    };
  };

  /**
   * @function before
   * @description
   * A function to intercept a method call on an object or class and call a
   * function with the intercepted parameters
   * @param {object | Function} target - the target class or object.
   * @param {string} methodName - the method name to intercept
   * @param {Function} fn - the function to call before the intercepted method
   * @example
   * var o = { x : function (a, b, c) { console.log('I got:', a, b, c); };
   * before(o, 'x', function (a, b, c) { console.log('Before ', a,b,c); });
   * o(1,2,3)
   * // this will log 'Before 123)' and then 'I got:1,2,3'
   */
  service.before = function before(target, methodName, fn) {
    const callback = target[methodName] || angular.noop;

    // replace with the injected function
    target[methodName] = function intercept() {

      // call the function before the cached callback
      const result = fn.apply(this, arguments);

      // fire the callback
      callback.apply(this, arguments);

      return result;
    };
  };

  /**
   * @function after
   * @description
   * A sister method to the `before()` function.  A function to intercept a
   * method call on an object or class and call a function with the intercepted
   * parameters after the original method call.
   * @param {object | Function} target - the target class or object.
   * @param {string} methodName - the method name to intercept
   * @param {Function} fn - the function to call after the intercepted method
   * @example
   * var o = { x : function (a, b, c) { console.log('I got:', a, b, c); };
   * after(o, 'x', function (a, b, c) { console.log('after', a,b,c); });
   * o(1,2,3)
   * // this will log 'After 123' and then 'I got:1,2,3'
   */
  service.after = function after(target, methodName, fn) {
    const callback = target[methodName] || angular.noop;

    // replace with the injected function
    target[methodName] = function intercept() {

      // fire the callback
      callback.apply(this, arguments);

      // call the function after the cached callback
      return fn.apply(this, arguments);
    };
  };

  /**
   * @function uniquelize
   * @param {Array} array An array in which we want to get only unique values
   * @description return an array which contain only unique values
   */
  service.uniquelize = function uniquelize(array) {
    return array.filter((value, idx, _array) => {
      return _array.indexOf(value) === idx;
    });
  };

  service.isEmptyObject = function isEmptyObject(object) {
    return Object.keys(object).length === 0;
  };

  /**
   * @function xor
   * @description
   * Returns the logical XOR of two booleans.
   * @param {boolean} a - a boolean value to XOR with b
   * @param {boolean} b - a boolean value to XOR with a
   * @returns {boolean} - the result
   */
  service.xor = function xor(a, b) {
    return !a !== !b;
  };

  /**
   * @function maskObjectFromKeys
   * @description
   * This function will filter or "mask" an object, returning a new object with only
   * key/value pairs matching the array of keys passed in as the second parameter.  The
   * keys do not all have to be contained in the object.
   * @param {object} object - an existing object
   * @param {Array} mask - an array of (string) keys to mask
   * @returns {object} - a new object contain key/value pairs corresponding
   * to only the keys specified.
   */
  service.maskObjectFromKeys = function maskObjectFromKeys(object, mask) {
    return Object.keys(object)

      //  for each key, if the key exists in the mask, add the k/v pair to the
      //  screened object.
      .reduce((screenedObject, key) => {
        if (mask.indexOf(key) >= 0) {
          screenedObject[key] = object[key];
        }

        return screenedObject;
      }, {});
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  /**
   *
   * @param func
   * @param wait
   * @param immediate
   */
  function debounce(func, wait, immediate) {
    let timeout;
    return function out() {
      const context = this;

      const args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  service.debounce = debounce;

  service.arrayIncludes = function arrayIncludes(array, values) {
    return values.some((value) => {
      return array.indexOf(value) !== -1;
    });
  };

  // This function retrieves the number as well as
  // the number of digits after the decimal point by returning the rounded number
  service.roundDecimal = function roundDecimal(number, precision) {
    const base = 10 ** precision;
    return Math.round(number * base) / base;
  };

  /**
   * @function groupBy
   * @description group an array of objects according a property
   * @param {Array} array
   * @param {string} property
   * @returns {object}
   */
  service.groupBy = (array, property) => {
    const out = {};
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      const value = item[property];
      if (!out[value]) {
        out[value] = [];
      }
      out[value].push(item);
    }
    return out;
  };

  /**
   * @function mimeIcon
   * @param {string} mimetype
   */
  service.mimeIcon = (mimetype) => {
    let result = {};
    let ext;

    if (mimetype.indexOf('image') > -1) {
       
      ext = (mimetype.indexOf('jpg') > -1 || mimetype.indexOf('jpeg') > -1) ? '.jpg'
        : (mimetype.indexOf('png') > -1) ? '.png'
          : (mimetype.indexOf('gif') > -1) ? '.gif' : '';

      result = { icon : 'fa-file-image-o', label : 'Image', ext };
    } else if (mimetype.indexOf('pdf') > -1) {
      result = { icon : 'fa-file-pdf-o', label : 'PDF', ext : '.pdf' };
    } else if (mimetype.indexOf('word') > -1) {
      result = { icon : 'fa-file-word-o', label : 'MS WORD', ext : '.doc' };
    } else if (mimetype.indexOf('sheet') > -1) {
      result = { icon : 'fa-file-excel-o', label : 'MS EXCEL', ext : '.xls' };
    } else if (mimetype.indexOf('presentation') > -1) {
      result = { icon : 'fa-file-powerpoint-o', label : 'MS Power Point', ext : '.ppt' };
    } else {
      result = { icon : 'fa-file-o', label : 'Fichier', ext : '' };
    }

    return result;
  };
}
