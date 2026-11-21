(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .component("appointmentBooking", {
      templateUrl: "/features/booking/booking.html",
      bindings: {
        specialtyName: "<",
        onClose: "&",
      },
      controller: [
        "$scope",
        "api",
        "dateUtils",
        "medicalSpecialties",
        function AppointmentBookingController($scope, api, dateUtils, medicalSpecialties) {
          const ctrl = this;
          ctrl.specialties = medicalSpecialties;
          ctrl.patient = {};
          ctrl.profile = {};
          ctrl.selectedDoctor = {};
          ctrl.selectedDate = {};
          ctrl.selectedTime = "";
          ctrl.availableTimes = [];
          ctrl.doctors = [];
          ctrl.confirmed = false;
          ctrl.confirming = false;
          ctrl.errorMessage = "";
          ctrl.folio = "";
          ctrl.availableDates = dateUtils.buildAvailableDates();

          ctrl.$onInit = function () {
            api.getProfile()
              .then(function (response) {
                ctrl.profile = response.data.profile;
                ctrl.patient = {
                  name: ctrl.profile.fullName,
                  phone: ctrl.profile.phone,
                  email: ctrl.profile.email,
                };
              })
              .catch(function () {
                ctrl.profile = {};
                ctrl.patient = {};
              });
            const matching = medicalSpecialties.find(function (item) {
              return item.name === ctrl.specialtyName;
            });
            ctrl.selectedSpecialty = matching ? matching.id : (ctrl.specialtyName || "");
            ctrl.updateSpecialtyName();
            ctrl.updateDoctors();
          };

          ctrl.$onChanges = function (changes) {
            if (changes.specialtyName && !changes.specialtyName.isFirstChange()) {
              const matching = medicalSpecialties.find(function (item) {
                return item.name === changes.specialtyName.currentValue;
              });
              ctrl.selectedSpecialty = matching
                ? matching.id
                : (changes.specialtyName.currentValue || "");
              ctrl.updateSpecialtyName();
              ctrl.changeSpecialty();
            }
          };

          ctrl.changeSpecialty = function () {
            ctrl.selectedDoctor = {};
            ctrl.confirmed = false;
            ctrl.selectedTime = "";
            ctrl.availableTimes = [];
            ctrl.updateSpecialtyName();
            ctrl.updateDoctors();
          };

          ctrl.updateSpecialtyName = function () {
            const matching = medicalSpecialties.find(function (item) {
              return item.id === ctrl.selectedSpecialty;
            });
            ctrl.selectedSpecialtyName = matching ? matching.name : "";
          };

          ctrl.updateDoctors = function () {
            if (!ctrl.selectedSpecialty) {
              ctrl.doctors = [];
              return;
            }

            api.getDoctors(ctrl.selectedSpecialty)
              .then(function (response) {
                ctrl.doctors = response.data.doctors || [];
              })
              .catch(function () {
                ctrl.doctors = [];
                ctrl.errorMessage = "No fue posible cargar los médicos.";
              });
          };

          ctrl.selectDoctor = function (doctor) {
            ctrl.selectedDoctor = doctor;
            ctrl.confirmed = false;
            ctrl.selectedTime = "";
            ctrl.loadAvailability();
          };

          ctrl.selectDate = function (date) {
            ctrl.selectedDate = date;
            ctrl.confirmed = false;
            ctrl.selectedTime = "";
            ctrl.loadAvailability();
          };

          ctrl.loadAvailability = function () {
            if (!ctrl.selectedDoctor.id || !ctrl.selectedDate.value) {
              ctrl.availableTimes = [];
              return;
            }

            api.getAvailability(ctrl.selectedDoctor.id, ctrl.selectedDate.value)
              .then(function (response) {
                ctrl.availableTimes = (response.data.times || []).map(dateUtils.formatTime);
                ctrl.errorMessage = "";
              })
              .catch(function () {
                ctrl.availableTimes = [];
                ctrl.errorMessage = "No fue posible cargar los horarios.";
              });
          };

          ctrl.selectTime = function (time) {
            ctrl.selectedTime = time.value;
            ctrl.confirmed = false;
          };

          ctrl.canConfirm = function (form) {
            return !!(
              ctrl.selectedSpecialty &&
              ctrl.selectedDoctor.id &&
              ctrl.selectedDate.value &&
              ctrl.selectedTime &&
              ctrl.profile.fullName &&
              ctrl.profile.phone &&
              ctrl.profile.email &&
              (!form || form.$valid)
            );
          };

          ctrl.confirm = function () {
            if (!ctrl.canConfirm()) return;

            ctrl.confirming = true;
            ctrl.errorMessage = "";
            api.createAppointment({
              doctorId: ctrl.selectedDoctor.id,
              specialty: ctrl.selectedSpecialty,
              date: ctrl.selectedDate.value,
              time: ctrl.selectedTime,
            })
              .then(function (response) {
                ctrl.confirmed = true;
                ctrl.folio = response.data.appointment.folio;
                ctrl.loadAvailability();
              })
              .catch(function (response) {
                ctrl.confirmed = false;
                ctrl.errorMessage =
                  response.data && response.data.message
                    ? response.data.message
                    : "No fue posible registrar la cita.";
                ctrl.loadAvailability();
              })
              .finally(function () {
                ctrl.confirming = false;
              });
          };

          $scope.$watch(
            function () {
              return ctrl.selectedTime;
            },
            function () {
              ctrl.confirmed = false;
            },
          );
        },
      ],
    });
})();
