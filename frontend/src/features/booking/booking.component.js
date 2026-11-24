(function () {
  "use strict";

  angular.module("serviciosMedicosApp").component("appointmentBooking", {
    templateUrl: "/features/booking/booking.html",
    bindings: {
      specialtyName: "<",
      sessionUser: "<",
      resume: "<",
      onClose: "&",
    },
    controller: [
      "$window",
      "api",
      "dateUtils",
      "medicalSpecialties",
      function AppointmentBookingController(
        $window,
        api,
        dateUtils,
        medicalSpecialties,
      ) {
        const ctrl = this;
        const draftKey = "medicom.appointmentDraft";
        let doctorsRequest = 0;
        let availabilityRequest = 0;

        ctrl.specialties = medicalSpecialties;
        ctrl.selectedDoctor = {};
        ctrl.selectedDate = {};
        ctrl.selectedTime = "";
        ctrl.availableTimes = [];
        ctrl.doctors = [];
        ctrl.confirmed = false;
        ctrl.confirming = false;
        ctrl.errorMessage = "";
        ctrl.availabilityError = "";
        ctrl.loadingDoctors = false;
        ctrl.loadingTimes = false;
        ctrl.folio = "";
        ctrl.availableDates = dateUtils.buildAvailableDates();

        ctrl.$onInit = function () {
          const draft = ctrl.resume ? readDraft() : null;
          ctrl.selectedSpecialty = draft
            ? draft.specialty
            : findSpecialtyId(ctrl.specialtyName);
          if (draft) {
            ctrl.selectedDate =
              ctrl.availableDates.find((date) => date.value === draft.date) ||
              {};
          }
          ctrl.updateDoctors(draft);
        };

        function findSpecialtyId(name) {
          const specialty = medicalSpecialties.find(
            (item) => item.name === name || item.id === name,
          );
          return specialty ? specialty.id : "";
        }

        function readDraft() {
          try {
            const draft = $window.sessionStorage.getItem(draftKey);
            $window.sessionStorage.removeItem(draftKey);
            return JSON.parse(draft);
          } catch {
            return null;
          }
        }

        function requestLogin(selection) {
          try {
            $window.sessionStorage.setItem(draftKey, JSON.stringify(selection));
          } catch {
            // The login flow still works when browser storage is unavailable.
          }
          $window.location.assign("/login.html?cita=continuar");
        }

        ctrl.$onChanges = function (changes) {
          if (changes.specialtyName && !changes.specialtyName.isFirstChange()) {
            ctrl.selectedSpecialty = findSpecialtyId(
              changes.specialtyName.currentValue,
            );
            ctrl.changeSpecialty();
          }
        };

        ctrl.changeSpecialty = function () {
          ctrl.selectedDoctor = {};
          ctrl.confirmed = false;
          ctrl.selectedTime = "";
          ctrl.errorMessage = "";
          ctrl.loadAvailability();
          ctrl.updateDoctors();
        };

        ctrl.selectedSpecialtyName = function () {
          const matching = medicalSpecialties.find(function (item) {
            return item.id === ctrl.selectedSpecialty;
          });
          return matching ? matching.name : "";
        };

        ctrl.updateDoctors = function (draft) {
          const request = ++doctorsRequest;
          ctrl.doctors = [];
          ctrl.loadingDoctors = !!ctrl.selectedSpecialty;
          if (!ctrl.selectedSpecialty) return;

          api
            .getDoctors(ctrl.selectedSpecialty)
            .then(function (response) {
              if (request !== doctorsRequest) return;
              ctrl.doctors = response.data.doctors || [];
              if (draft) {
                const doctor = ctrl.doctors.find(
                  (item) => item.id === draft.doctorId,
                );
                if (!doctor) return;
                ctrl.selectedDoctor = doctor;
                ctrl.loadAvailability(draft.time);
              }
            })
            .catch(function () {
              if (request === doctorsRequest) {
                ctrl.errorMessage = "No fue posible cargar los médicos.";
              }
            })
            .finally(function () {
              if (request === doctorsRequest) ctrl.loadingDoctors = false;
            });
        };

        ctrl.selectDoctor = function (doctor) {
          ctrl.selectedDoctor = doctor;
          ctrl.confirmed = false;
          ctrl.selectedTime = "";
          ctrl.errorMessage = "";
          ctrl.loadAvailability();
        };

        ctrl.selectDate = function (date) {
          ctrl.selectedDate = date;
          ctrl.confirmed = false;
          ctrl.selectedTime = "";
          ctrl.errorMessage = "";
          ctrl.loadAvailability();
        };

        ctrl.loadAvailability = function (resumeTime) {
          const request = ++availabilityRequest;
          ctrl.availableTimes = [];
          ctrl.availabilityError = "";
          ctrl.loadingTimes = false;
          if (!ctrl.selectedDoctor.id || !ctrl.selectedDate.value) {
            return;
          }

          ctrl.loadingTimes = true;
          api
            .getAvailability(ctrl.selectedDoctor.id, ctrl.selectedDate.value)
            .then(function (response) {
              if (request !== availabilityRequest) return;
              ctrl.availableTimes = (response.data.times || []).map(
                dateUtils.formatTime,
              );
              if (resumeTime) {
                if (
                  ctrl.availableTimes.some((time) => time.value === resumeTime)
                ) {
                  ctrl.selectedTime = resumeTime;
                } else {
                  ctrl.errorMessage =
                    "El horario seleccionado ya no está disponible. Elige otro.";
                }
              }
            })
            .catch(function () {
              if (request === availabilityRequest) {
                ctrl.availabilityError = "No fue posible cargar los horarios.";
              }
            })
            .finally(function () {
              if (request === availabilityRequest) ctrl.loadingTimes = false;
            });
        };

        ctrl.selectTime = function (time) {
          ctrl.selectedTime = time.value;
          ctrl.confirmed = false;
          ctrl.errorMessage = "";
        };

        ctrl.canConfirm = function () {
          return !!(
            !ctrl.confirming &&
            !ctrl.confirmed &&
            !ctrl.loadingTimes &&
            ctrl.selectedSpecialty &&
            ctrl.selectedDoctor.id &&
            ctrl.selectedDate.value &&
            ctrl.availableTimes.some((time) => time.value === ctrl.selectedTime)
          );
        };

        ctrl.confirm = function () {
          if (!ctrl.canConfirm()) return;

          ctrl.confirming = true;
          ctrl.errorMessage = "";
          const selection = {
            doctorId: ctrl.selectedDoctor.id,
            specialty: ctrl.selectedSpecialty,
            date: ctrl.selectedDate.value,
            time: ctrl.selectedTime,
          };

          api
            .createAppointment(selection)
            .then(function (response) {
              ctrl.confirmed = true;
              ctrl.folio = response.data.appointment.folio;
              ctrl.loadAvailability();
            })
            .catch(function (response) {
              if (response.status === 401) {
                requestLogin(selection);
                return;
              }

              ctrl.errorMessage =
                response.data && response.data.message
                  ? response.data.message
                  : "No fue posible registrar la cita.";
              if (response.status === 409) {
                ctrl.selectedTime = "";
                ctrl.loadAvailability();
              }
            })
            .finally(function () {
              ctrl.confirming = false;
            });
        };
      },
    ],
  });
})();
