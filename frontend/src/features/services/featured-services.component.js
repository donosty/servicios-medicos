(function () {
  "use strict";

  angular.module("serviciosMedicosApp").component("featuredServices", {
    templateUrl: "/features/services/featured-services.html",
    controller: [
      "api",
      function FeaturedServicesController(api) {
        const ctrl = this;
        ctrl.services = [];

        ctrl.$onInit = function () {
          api
            .getMedicalServices()
            .then(function (response) {
              const services = response.data.services || [];
              const featured = ["urgencias", "imagenologia", "laboratorio", "medicina-general"];
              ctrl.services = featured
                .map((id) => services.find((service) => service.id === id))
                .filter(Boolean);
            })
            .catch(function () {
              ctrl.services = [];
            });
        };
      },
    ],
  });
})();
