(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp", [])
    .controller("HomeController", [
      "$document",
      "$timeout",
      function HomeController($document, $timeout) {
        const home = this;
        const doc = $document[0];
        home.searchText = "";
        home.query = "";
        home.menuOpen = false;

        home.toggleMenu = function () {
          home.menuOpen = !home.menuOpen;
          if (home.menuOpen) {
            $timeout(
              () => doc.querySelector("#menu-principal a").focus(),
              0,
              false,
            );
          }
        };

        home.closeMenu = function () {
          home.menuOpen = false;
        };

        home.handleMenuKey = function (event) {
          if (event.key === "Escape" && home.menuOpen) {
            home.closeMenu();
            doc.getElementById("menu-toggle").focus();
          }
        };

        home.showNotice = function (message, event) {
          const dialog = doc.getElementById("notice");
          const trigger = event.currentTarget;
          const fromMenu = home.menuOpen && trigger.closest("#menu-principal");
          home.closeMenu();
          home.notice = message;
          dialog.addEventListener(
            "close",
            () => {
              (fromMenu ? doc.getElementById("menu-toggle") : trigger).focus();
            },
            { once: true },
          );
          dialog.showModal();
        };

        home.closeNotice = function () {
          doc.getElementById("notice").close();
        };

        home.filterBy = function (name) {
          home.searchText = name;
          home.query = name.trim();
          $timeout(
            () => {
              doc
                .getElementById("titulo-especialidades")
                .focus({ preventScroll: true });
              doc.getElementById("especialidades").scrollIntoView();
            },
            0,
            false,
          );
        };

        home.search = function () {
          home.filterBy(home.searchText || "");
        };

        home.clearSearch = function () {
          home.filterBy("");
        };
      },
    ])
    .component("homeFooter", {
      templateUrl: "/components/footer.html",
      bindings: { onNotice: "&", onSelect: "&" },
      controller: [
        "medicalSpecialties",
        function HomeFooterController(specialties) {
          this.specialties = specialties;
        },
      ],
    });
})();
