(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .component("featuredServices", {
      templateUrl: "/features/services/featured-services.html",
      controller: [
        "api",
        function FeaturedServicesController(api) {
          const ctrl = this;
          ctrl.services = [];

          ctrl.$onInit = function () {
            api.getMedicalServices()
              .then(function (response) {
                ctrl.services = (response.data.services || []).slice(0, 4);
              })
              .catch(function () {
                ctrl.services = [];
              });
          };
        },
      ],
    });
})();
