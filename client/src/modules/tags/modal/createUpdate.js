angular.module('bhima.controllers')
  .controller('TagsModalController', TagsModalController);

TagsModalController.$inject = [
  'data', 'TagService', 'NotifyService',
  '$uibModalInstance', '$rootScope', 'ColorService',
];

/**
 *
 * @param data
 * @param TagsService
 * @param Notify
 * @param Instance
 * @param $rootScope
 * @param Colors
 */
function TagsModalController(
  data, TagsService, Notify, Instance, $rootScope, Colors,
) {
  const vm = this;
  vm.colors = Colors.list.map(addIconStyle);
  vm.close = Instance.close;
  vm.submit = submit;

  vm.tags = data ? angular.copy(data) : {};
  vm.isCreation = !vm.tags.uuid;
  vm.action = vm.isCreation ? 'FORM.LABELS.CREATE' : 'FORM.LABELS.UPDATE';

  /**
   *
   * @param item
   */
  function addIconStyle(item) {
    item.style = { color : item.value };
    return item;
  }

  /**
   *
   * @param form
   */
  function submit(form) {
    if (form.$invalid) {
      return false;
    }

    // Do not allow semicolons or vertical bars in tag names since they will be
    // used to separate the parts of the tags when retrieving them from the back end.
    if (vm.tags.name.includes(';') || vm.tags.name.includes('|')) {
      form.name.$invalid = true;
      form.name.$valid = false;
      return false;
    }

    [].concat(vm.tags).forEach(tag => {
      delete tag.style;
    });

    const operation = vm.isCreation
      ? TagsService.create(vm.tags)
      : TagsService.update(data.uuid, vm.tags);

    return operation
      .then(() => {
        Notify.success('FORM.INFO.OPERATION_SUCCESS');
        $rootScope.$broadcast('TAGS_CHANGED', true);
        vm.close();
      })
      .catch(Notify.handleError);

  }
}
