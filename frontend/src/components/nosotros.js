(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .controller("NosotrosController", [function NosotrosController() {}])
    .component("medicalAbout", {
      templateUrl: "/components/nosotros.html",
      bindings: { onClose: "&", onBook: "&" },
      controller: "NosotrosController",
    });
})();
