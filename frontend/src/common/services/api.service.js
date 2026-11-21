(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .factory("api", [
      "$http",
      function ApiService($http) {
        return {
          getSpecialties: function () {
            return $http.get("/api/specialties");
          },
          getDoctors: function (specialty) {
            return $http.get("/api/doctors", { params: { specialty: specialty } });
          },
          getAvailability: function (doctorId, date) {
            return $http.get("/api/availability", {
              params: { doctorId: doctorId, date: date },
            });
          },
          createAppointment: function (appointment) {
            return $http.post("/api/appointments", appointment);
          },
        };
      },
    ]);
})();
