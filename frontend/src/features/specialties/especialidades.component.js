(function () {
  "use strict";

  angular.module("serviciosMedicosApp").component("specialtyCatalog", {
    templateUrl: "/features/specialties/especialidades.html",
    bindings: { query: "=", onClose: "&", onBook: "&" },
    controller: [
      "$scope",
      "medicalSpecialties",
      "stringUtils",
      function SpecialtyCatalogController(
        $scope,
        medicalSpecialties,
        stringUtils,
      ) {
        const ctrl = this;
        ctrl.specialties = medicalSpecialties;

        function filterSpecialties() {
          const term = stringUtils.normalizeName(ctrl.query);
          ctrl.matches = medicalSpecialties.filter((item) =>
            stringUtils.normalizeName(item.name).includes(term),
          );
        }

        $scope.$watch(() => ctrl.query, filterSpecialties);
        $scope.$watchCollection(() => medicalSpecialties, filterSpecialties);
      },
    ],
  });
})();
