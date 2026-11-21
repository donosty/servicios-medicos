(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .controller("NosotrosController", [function NosotrosController() {}])
    .component("medicalAbout", {
      templateUrl: "/features/nosotros/nosotros.html",
      bindings: { onClose: "&", onBook: "&" },
      controller: "NosotrosController",
    });
})();
