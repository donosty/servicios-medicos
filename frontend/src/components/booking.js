(function () {
  "use strict";

  const monthNames = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const dayNames = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

  angular
    .module("serviciosMedicosApp")
    .component("appointmentBooking", {
      templateUrl: "/components/booking.html",
      bindings: {
        specialtyName: "<",
        onClose: "&",
      },
      controller: [
        "$scope",
        "$http",
        "medicalSpecialties",
        function AppointmentBookingController($scope, $http, medicalSpecialties) {
          const ctrl = this;
          ctrl.specialties = medicalSpecialties;
          ctrl.patient = {};
          ctrl.selectedDoctor = {};
          ctrl.selectedDate = {};
          ctrl.selectedTime = "";
          ctrl.availableTimes = [];
          ctrl.doctors = [];
          ctrl.confirmed = false;
          ctrl.confirming = false;
          ctrl.errorMessage = "";
          ctrl.folio = "";

          ctrl.availableDates = buildDates();

          ctrl.$onInit = function () {
            const matching = medicalSpecialties.filter(function (item) {
              return item.name === ctrl.specialtyName;
            })[0];
            ctrl.selectedSpecialty = matching ? matching.id : (ctrl.specialtyName || "");
            ctrl.updateSpecialtyName();
            ctrl.updateDoctors();
          };

          ctrl.$onChanges = function (changes) {
            if (changes.specialtyName && !changes.specialtyName.isFirstChange()) {
              const matching = medicalSpecialties.filter(function (item) {
                return item.name === changes.specialtyName.currentValue;
              })[0];
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
            const matching = medicalSpecialties.filter(function (item) {
              return item.id === ctrl.selectedSpecialty;
            })[0];
            ctrl.selectedSpecialtyName = matching ? matching.name : "";
          };

          ctrl.updateDoctors = function () {
            if (!ctrl.selectedSpecialty) {
              ctrl.doctors = [];
              return;
            }
            $http
              .get("/api/doctors", { params: { specialty: ctrl.selectedSpecialty } })
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
            $http
              .get("/api/availability", {
                params: {
                  doctorId: ctrl.selectedDoctor.id,
                  date: ctrl.selectedDate.value,
                },
              })
              .then(function (response) {
                ctrl.availableTimes = (response.data.times || []).map(formatTime);
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
              ctrl.patient.name &&
              ctrl.patient.phone &&
              ctrl.patient.email &&
              (!form || form.$valid)
            );
          };

          ctrl.confirm = function () {
            if (!ctrl.canConfirm()) return;
            ctrl.confirming = true;
            ctrl.errorMessage = "";
            $http
              .post("/api/appointments", {
                doctorId: ctrl.selectedDoctor.id,
                specialty: ctrl.selectedSpecialty,
                date: ctrl.selectedDate.value,
                time: ctrl.selectedTime,
                patient: {
                  name: ctrl.patient.name,
                  phone: ctrl.patient.phone,
                  email: ctrl.patient.email,
                },
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
              return [
                ctrl.selectedTime,
                ctrl.patient.name,
                ctrl.patient.phone,
                ctrl.patient.email,
              ].join("|");
            },
            function () {
              ctrl.confirmed = false;
            },
          );

          function formatTime(time) {
            const parts = time.split(":");
            let hour = Number(parts[0]);
            const minute = parts[1];
            const period = hour >= 12 ? "PM" : "AM";
            hour = hour % 12 || 12;
            return {
              value: time,
              label: hour + ":" + minute + " " + period,
            };
          }

          function buildDates() {
            const dates = [];
            const today = new Date();
            for (let offset = 1; offset <= 7; offset += 1) {
              const date = new Date(today);
              date.setDate(today.getDate() + offset);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              dates.push({
                value: year + "-" + month + "-" + day,
                day: dayNames[date.getDay()],
                dayNumber: String(date.getDate()),
                month: monthNames[date.getMonth()],
                label:
                  dayNames[date.getDay()] +
                  " " +
                  date.getDate() +
                  " de " +
                  monthNames[date.getMonth()],
              });
            }
            return dates;
          }
        },
      ],
    });
})();
