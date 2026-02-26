angular.module('bhima.services')
  .service('Pool', PoolService);

PoolService.$inject = ['Store'];

/**
 *
 * @param Store
 */
function PoolService(Store) {

  /**
   *
   * @param identifier
   * @param data
   */
  function Pool(identifier, data) {
    this.initialize(identifier, data);
  }

  // initialize the stores with data
  Pool.prototype.initialize = function initialize(identifier = 'id', data = []) {
    this.available = new Store({
      identifier,
      data,
    });

    this.unavailable = new Store({
      identifier,
      data : [],
    });

    this._size = data.length;
  };

  // remove the item from the pool
  Pool.prototype.use = function use(id) {
    const item = this.available.get(id);
    if (item) {
      this.available.remove(id);
      this.unavailable.post(item);
    }

    return item;
  };

  // return the unavailable item to the pool
  Pool.prototype.release = function release(id) {
    const item = this.unavailable.get(id);
    if (item) {
      this.unavailable.remove(id);
      this.available.post(item);
    }

    return item;
  };

  // lists all available data in the Pool
  Pool.prototype.list = function list() {
    return this.available.data;
  };

  // the total number of items stored in the Pool
  Pool.prototype.size = function size() {
    return this._size;
  };

  return Pool;
}
