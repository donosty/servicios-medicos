(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .constant("featuredMedicalServices", [])
    .run([
      "api",
      "featuredMedicalServices",
      function LoadFeaturedMedicalServices(api, featuredMedicalServices) {
        api.getMedicalServices()
          .then(function (response) {
            featuredMedicalServices.splice(
              0,
              featuredMedicalServices.length,
              ...(response.data.services || []),
            );
          })
          .catch(function () {
            featuredMedicalServices.splice(0, featuredMedicalServices.length);
          });
      },
    ])
    .component("featuredServices", {
      templateUrl: "/features/services/featured-services.html",
      controller: [
        "featuredMedicalServices",
        function FeaturedServicesController(featuredMedicalServices) {
          this.services = featuredMedicalServices;
        },
      ],
    });
})();
