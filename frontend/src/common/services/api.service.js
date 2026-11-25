(function () {
  "use strict";

  angular.module("serviciosMedicosApp").factory("api", [
    "$http",
    function ApiService($http) {
      return {
        registerUser: function (user) {
          return $http.post("/api/auth/register", user);
        },
        loginUser: function (credentials) {
          return $http.post("/api/auth/login", credentials);
        },
        getSession: function () {
          return $http.get("/api/auth/session");
        },
        logout: function () {
          return $http.post("/api/auth/logout");
        },
        getProfile: function () {
          return $http.get("/api/profile");
        },
        updateProfile: function (profile) {
          return $http.patch("/api/profile", profile);
        },
        getProfileAppointments: function () {
          return $http.get("/api/profile/appointments");
        },
        getMedicalServices: function () {
          return $http.get("/api/services");
        },
        getSpecialties: function () {
          return $http.get("/api/specialties");
        },
        getDoctors: function (specialty) {
          return $http.get("/api/doctors", {
            params: { specialty: specialty },
          });
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
