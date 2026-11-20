(function () {
  "use strict";

  const doctors = [
    {
      id: "sofia",
      specialties: ["Pediatría"],
      name: "Dra. Sofía Martínez",
      description: "Pediatra. Especialista en atención integral infantil.",
      image: "/assets/photo 2.jpg",
    },
    {
      id: "carlos",
      specialties: ["Cardiología"],
      name: "Dr. Carlos Ramírez",
      description: "Cardiólogo. Prevención y cuidado de tu corazón.",
      image: "/assets/photo 3.jpg",
    },
    {
      id: "ana",
      specialties: ["Ginecología"],
      name: "Dra. Ana Torres",
      description: "Ginecóloga. Atención integral en cada etapa.",
      image: "/assets/photo 4.jpg",
    },
    {
      id: "miguel",
      specialties: ["Medicina General"],
      name: "Dr. Miguel Sánchez",
      description: "Médico general. Primera atención para toda la familia.",
      image: "/assets/photo 5.jpg",
    },
  ];

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
        "medicalSpecialties",
        function AppointmentBookingController($scope, medicalSpecialties) {
          const ctrl = this;
          ctrl.specialties = medicalSpecialties;
          ctrl.patient = {};
          ctrl.selectedDoctor = {};
          ctrl.selectedDate = {};
          ctrl.selectedTime = "";
          ctrl.confirmed = false;
          ctrl.availableTimes = [
            "8:00 AM", "9:30 AM", "11:00 AM", "12:30 PM",
            "4:00 PM", "5:30 PM", "6:30 PM", "7:30 PM",
          ];

          ctrl.availableDates = buildDates();

          ctrl.$onInit = function () {
            ctrl.selectedSpecialty = ctrl.specialtyName || "";
            ctrl.updateDoctors();
          };

          ctrl.$onChanges = function (changes) {
            if (changes.specialtyName && !changes.specialtyName.isFirstChange()) {
              ctrl.selectedSpecialty = changes.specialtyName.currentValue || "";
              ctrl.changeSpecialty();
            }
          };

          ctrl.changeSpecialty = function () {
            ctrl.selectedDoctor = {};
            ctrl.confirmed = false;
            ctrl.updateDoctors();
          };

          ctrl.updateDoctors = function () {
            ctrl.doctors = doctors.filter(function (doctor) {
              return doctor.specialties.indexOf(ctrl.selectedSpecialty) !== -1;
            });
            if (!ctrl.doctors.length) {
              ctrl.doctors = doctors;
            }
          };

          ctrl.selectDoctor = function (doctor) {
            ctrl.selectedDoctor = doctor;
            ctrl.confirmed = false;
          };

          ctrl.selectDate = function (date) {
            ctrl.selectedDate = date;
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
              form &&
              form.$valid
            );
          };

          ctrl.confirm = function () {
            ctrl.confirmed = true;
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
