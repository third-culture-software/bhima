angular.module('bhima.controllers')
  .controller('ProjectModalController', ProjectModalController);

// dependencies injections
ProjectModalController.$inject = [
  '$uibModalInstance', '$timeout', 'util', 'Upload', 'ProjectService', 'NotifyService', 'data',
];

function ProjectModalController(Instance, $timeout, util, Upload, Projects, Notify, Data) {
  const vm = this;

  vm.project = {};
  vm.enterprise = Data.enterprise; // the project enterprise

  vm.maxLength = util.maxTextLength;
  vm.length50 = util.length50;
  vm.length100 = util.length100;
  vm.hasEnterprise = false;
  vm.maxLogoFileSize = '2MB';
  vm.setThumbnail = setThumbnail;
  vm.removeLogo = removeLogo;

  vm.isCreateState = (Data.action === 'create');
  vm.isEditState = (Data.action === 'edit');

  // expose to the view
  vm.submit = submit;
  vm.close = Instance.close;

  function setThumbnail(file) {
    if (!file) {
      vm.documentError = true;
      return;
    }
    const isImage = file.type.includes('image/');
    vm.thumbnail = file;
    vm.hasThumbnail = (vm.thumbnail && isImage);
  }

  function removeLogo() {
    return Projects.update(vm.project.id, { logo : null })
      .then(() => {
        vm.project.logo = null;
        Instance.close(true);
      })
      .catch(Notify.handleError);
  }

  const createProject = (project) => {
    return Upload.upload({
      method : 'POST',
      url : `/projects`,
      data : { ...project, logo : vm.file },
    });
  };

  const updateProject = (project) => {
    return Upload.upload({
      method : 'PUT',
      url : `/projects/${project.id}`,
      data : { ...project, logo : vm.file },
    });
  };

  /**
   * @function submitProject
   * @desc submit project data to the server for create or update
   * @param {object} form The project form instance
   */
  function submit(form) {
    if (form.$invalid) {
      Notify.danger('FORM.ERRORS.HAS_ERRORS');
      return 0;
    }

    const project = angular.copy(vm.project);

    // set enterprise
    project.enterprise_id = vm.enterprise.id;

    // set locked boolean required
    project.locked = project.locked ? 1 : 0;

    // zs
    project.zs_id = project.zs_id || 0;

    const promise = vm.isCreateState ? createProject(project) : updateProject(project);

    return promise
      .then(() => {
        Instance.close(true);
      })
      .catch(Notify.handleError);
  }

  /* startup function */
  function startup() {
    if (vm.isEditState && Data.identifier) {
      Projects.read(Data.identifier)
        .then(project => {
          vm.project = project;
        })
        .catch(Notify.handleError);
    }
  }

  startup();
}
