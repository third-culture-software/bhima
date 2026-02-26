angular.module('bhima.controllers')
  .controller('PatientRecordController', PatientRecordController);

PatientRecordController.$inject = [
  '$stateParams', 'PatientService', 'NotifyService',
  'moment', 'Upload', '$timeout', 'SnapshotService',
];

/**
 *
 * @param $stateParams
 * @param Patients
 * @param Notify
 * @param moment
 * @param Upload
 * @param $timeout
 * @param SnapshotService
 */
function PatientRecordController($stateParams, Patients, Notify, moment, Upload, $timeout, SnapshotService) {
  const vm = this;
  const { patientUuid } = $stateParams;

  vm.loading = true;
  vm.uploadFiles = uploadFiles;
  vm.uploadButtonText = 'PATIENT_RECORDS.UPLOAD_PICTURE';

  /**
   *
   * @param file
   * @param invalidFiles
   */
  function uploadFiles(file, invalidFiles) {
    if (invalidFiles.length) {
      Notify.danger('FORM.WARNINGS.BAD_FILE_TYPE');
      return;
    }

    if (file) {
      const imageCheck = file.type.search('image/');
      if (imageCheck !== -1) {
        file.upload = Upload.upload({
          url : `/patients/${patientUuid}/pictures`,
          data : { pictures : file },
        });

        file.upload.then((response) => {
          Notify.success('FORM.INFO.PATIENT_SUCC_TRANSFERRED');
          $timeout(() => {
            vm.patient.avatar = response.data.link;
          });
        })
          .catch((error) => {
            Notify.handleError(error);
          });
      } else {
        Notify.danger('FORM.INFO.UPLOAD_PICTURE_FAILED');
      }
    }
  }

  /**
   *
   */
  function startup() {
    if (!patientUuid) { return; }

    Patients.read(patientUuid)
      .then((result) => {
        vm.patient = result;

        if (vm.patient.avatar) {
          vm.uploadButtonText = 'PATIENT_RECORDS.UPDATE_PICTURE';
        }

        vm.patient.name = vm.patient.display_name;
        vm.patient.age = moment().diff(vm.patient.dob, 'years');
        vm.patient.dobFormatted = moment(vm.patient.dob).format('L');

        return Patients.groups(patientUuid);
      })
      .then(groups => {
        vm.patient.groups = groups;
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  startup();

  // webcam functionnalities
  vm.openWebcam = function openWebcam() {
    SnapshotService.openWebcamModal()
      .then((strDataURI) => {
        if (strDataURI) {
          SnapshotService.dataUriToFile(
            strDataURI,
            'image.png',
            'image/png',
          )
            .then((file) => {
              vm.uploadFiles(file, false);
            });
        }
      });
  };
}
