(function () {
  "use strict";

  angular.module("serviciosMedicosApp").component("medicalServices", {
    templateUrl: "/features/servicios/servicios-medicos.html",
    bindings: { onClose: "&", onBook: "&" },
    controller: [
      "api",
      "stringUtils",
      function ServiciosMedicosController(api, stringUtils) {
        const ctrl = this;
        const normalize = stringUtils.normalizeName;

        ctrl.searchText = "";
        ctrl.selectedCategory = "";
        ctrl.selectedSpecialty = "";
        ctrl.selectedAvailability = "";
        ctrl.minPrice = null;
        ctrl.maxPrice = null;
        ctrl.services = [];
        ctrl.visibleServices = [];
        ctrl.categories = [];
        ctrl.specialties = [];

        ctrl.loadServices = function () {
          ctrl.loading = true;
          ctrl.loadError = false;
          return api
            .getMedicalServices()
            .then(function (response) {
              const services = response.data.services || [];
              ctrl.services = services.slice().sort(function (first, second) {
                return (
                  first.catalogOrder - second.catalogOrder ||
                  first.serviceId - second.serviceId
                );
              });
              ctrl.categories = Array.from(
                new Set(
                  ctrl.services
                    .map((service) => service.category)
                    .filter(
                      (category) =>
                        category &&
                        !/^urgencias(?:\s|$)/i.test(category.trim()),
                    ),
                ),
              );
              const specialties = new Map();
              ctrl.services.forEach(function (service) {
                service.specialties.forEach((specialty) =>
                  specialties.set(specialty.id, specialty),
                );
              });
              ctrl.specialties = Array.from(specialties.values()).sort(
                (first, second) =>
                  first.name.localeCompare(second.name, "es-MX"),
              );
              ctrl.filterServices();
            })
            .catch(function () {
              ctrl.loadError = true;
            })
            .finally(function () {
              ctrl.loading = false;
            });
        };

        ctrl.hasInvalidPrice = function () {
          return (
            ctrl.priceForm?.$invalid ||
            (ctrl.minPrice != null &&
              ctrl.maxPrice != null &&
              ctrl.minPrice > ctrl.maxPrice)
          );
        };

        ctrl.filterServices = function () {
          const term = normalize(ctrl.searchText);
          const hasPriceFilter = ctrl.minPrice != null || ctrl.maxPrice != null;
          ctrl.visibleServices = [];
          for (const service of ctrl.services) {
            const specialty = service.specialties.find(
              (item) => item.id === ctrl.selectedSpecialty,
            );
            if (ctrl.selectedSpecialty && !specialty) continue;

            const available = specialty?.available ?? service.available;
            const matchesCategory =
              !ctrl.selectedCategory ||
              service.category === ctrl.selectedCategory;
            const matchesAvailability =
              !ctrl.selectedAvailability ||
              available === (ctrl.selectedAvailability === "available");
            const matchesPrice =
              !hasPriceFilter ||
              (service.price != null &&
                (ctrl.minPrice == null || service.price >= ctrl.minPrice) &&
                (ctrl.maxPrice == null || service.price <= ctrl.maxPrice));
            const searchValues = [
              service.title,
              service.name,
              String(service.serviceId),
              ...service.specialties.map((item) => item.name),
            ];
            const matchesSearch =
              !term ||
              searchValues.some((value) => normalize(value).includes(term));

            if (
              matchesCategory &&
              matchesAvailability &&
              matchesPrice &&
              matchesSearch
            ) {
              ctrl.visibleServices.push({
                ...service,
                available,
                bookingSpecialty: available
                  ? (specialty?.id ?? service.bookingSpecialty)
                  : null,
              });
            }
          }
        };

        ctrl.selectCategory = function (category) {
          ctrl.selectedCategory = category;
          ctrl.filterServices();
        };

        ctrl.$onInit = ctrl.loadServices;
      },
    ],
  });
})();
