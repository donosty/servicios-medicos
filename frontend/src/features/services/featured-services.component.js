(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .constant("medicalServiceCatalog", { featured: [], prices: {}, error: false })
    .run([
      "api",
      "medicalServiceCatalog",
      function LoadMedicalServices(api, catalog) {
        api.getMedicalServices()
          .then(function (response) {
            const services = response.data.services || [];
            catalog.featured = services.slice(0, 4);
            services.forEach(function (service) {
              catalog.prices[service.id] = service.price;
            });
          })
          .catch(function () {
            catalog.error = true;
          });
      },
    ])
    .component("featuredServices", {
      templateUrl: "/features/services/featured-services.html",
      controller: [
        "medicalServiceCatalog",
        function FeaturedServicesController(catalog) {
          this.catalog = catalog;
        },
      ],
    });
})();
