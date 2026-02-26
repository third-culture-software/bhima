angular.module('bhima.components')
  .component('bhPatientVisit', {
    bindings : {
      patientUuid : '<',
    },
    templateUrl : 'modules/patients/record/bh-patient-visit.html',
    controller  : VisitsController,
  });

VisitsController.$inject = ['PatientService', 'NotifyService', 'moment'];

/**
 *
 * @param Patients
 * @param Notify
 * @param Moment
 */
function VisitsController(Patients, Notify, Moment) {
  const $ctrl = this;
  let mostRecentVisit;

  // Currently not limited on client to give accurate representation of total
  // number of visits
  const DEFAULT_VISIT_LIMIT = 3;

  this.$onInit = () => {
    $ctrl.loaded = false;
    $ctrl.visiting = false;

    $ctrl.limitVisitDisplay = DEFAULT_VISIT_LIMIT;

    refreshVisitFeed();
  };

  // expose methods to the view
  $ctrl.admit = admit;
  $ctrl.toggleViewLimit = toggleViewLimit;

  /**
   *
   */
  function refreshVisitFeed() {
    $ctrl.loaded = false;

    return Patients.Visits.read($ctrl.patientUuid)
      .then(visits => {
        visits.forEach(visit => {
          calculateDays(visit);
          hrBedLocation(visit);
        });
        [mostRecentVisit] = visits;

        if (mostRecentVisit) {
          $ctrl.visiting = Boolean(mostRecentVisit.is_open);
        }

        $ctrl.visits = visits;

        $ctrl.hasOverflowVisits = (visits.length > DEFAULT_VISIT_LIMIT);
        $ctrl.loaded = true;
      });
  }

  /**
   *
   */
  function toggleViewLimit() {
    $ctrl.hasExpandedView = ($ctrl.limitVisitDisplay === DEFAULT_VISIT_LIMIT);
    $ctrl.limitVisitDisplay = $ctrl.hasExpandedView ? 1000 : DEFAULT_VISIT_LIMIT;
  }

  /**
   *
   * @param visit
   */
  function calculateDays(visit) {
    const startDate = new Moment(visit.start_date);
    const endDate = new Moment(visit.end_date);
    visit.totalDays = endDate.diff(startDate, 'days');
  }

  /**
   *
   * @param visit
   */
  function hrBedLocation(visit) {
    visit.hrBedLocation = (visit.ward_name || '').concat('/', visit.room_label, '/', visit.bed_label);
  }

  /**
   *
   */
  function admit() {
    const isAdmission = !$ctrl.visiting;
    Patients.Visits.openAdmission($ctrl.patientUuid, isAdmission, mostRecentVisit)
      .then(() => refreshVisitFeed())
      .catch(Notify.handleError);
  }
}
