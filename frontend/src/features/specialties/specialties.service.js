(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .constant("medicalSpecialties", [])
    .run([
      "api",
      "medicalSpecialties",
      function LoadMedicalSpecialties(api, medicalSpecialties) {
        api.getSpecialties()
          .then(function (response) {
            medicalSpecialties.splice(
              0,
              medicalSpecialties.length,
              ...(response.data.specialties || []),
            );
          })
          .catch(function () {
            medicalSpecialties.splice(0, medicalSpecialties.length);
          });
      },
    ]);
})();
