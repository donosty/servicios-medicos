(function () {
  "use strict";

  angular.module("serviciosMedicosApp").component("homeFooter", {
    templateUrl: "/app/components/footer.html",
    bindings: {
      onHome: "&",
      onNotice: "&",
      onSelect: "&",
      onServices: "&",
      onBlog: "&",
      onAbout: "&",
    },
    controller: [
      "medicalSpecialties",
      function HomeFooterController(specialties) {
        this.specialties = specialties;
      },
    ],
  });
})();
