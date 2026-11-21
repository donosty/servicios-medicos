(function () {
  "use strict";

  angular.module("serviciosMedicosApp").controller("HomeController", [
    "$document",
    "$timeout",
      "api",
      "$window",
      function HomeController($document, $timeout, api, $window) {
      const home = this;
      const doc = $document[0];

      home.searchText = "";
      home.query = "";
      home.menuOpen = false;
      home.bookingOpen = false;
      home.bookingSpecialty = "";
      home.servicesOpen = false;
      home.blogOpen = false;
      home.aboutOpen = false;

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
          () =>
            (fromMenu ? doc.getElementById("menu-toggle") : trigger).focus(),
          { once: true },
        );
        dialog.showModal();
      };

      home.closeNotice = function () {
        doc.getElementById("notice").close();
      };

      home.returnHome = function () {
        home.bookingOpen = false;
        home.servicesOpen = false;
        home.blogOpen = false;
        home.aboutOpen = false;
        home.closeMenu();
      };

      home.filterBy = function (name) {
        home.returnHome();
        home.searchText = name;
        home.query = name.trim();
        $timeout(
          () => {
            const section = doc.getElementById("especialidades");
            if (section) {
              const heading = doc.getElementById("titulo-especialidades");
              (heading || section).focus({ preventScroll: true });
              section.scrollIntoView();
            }
          },
          0,
          false,
        );
      };

      home.search = function () {
        home.filterBy(home.searchText || "");
      };

      home.openBooking = function (name) {
        home.bookingOpen = true;
        home.servicesOpen = false;
        home.blogOpen = false;
        home.aboutOpen = false;
        home.bookingSpecialty = name || "";
        home.closeMenu();
        $timeout(
          () => {
            const heading = doc.getElementById("agenda-titulo");
            if (heading) {
              heading.focus();
              doc.getElementById("contenido").scrollIntoView();
            }
          },
          0,
          false,
        );
      };

      home.closeBooking = function () {
        home.returnHome();
        $timeout(
          () => doc.querySelector(".header-actions .book-button").focus(),
          0,
          false,
        );
      };

      home.clearSearch = function () {
        home.filterBy("");
      };

      home.logout = function () {
        api.logout().finally(function () {
          $window.location.replace("/login.html");
        });
      };

      home.openServices = function () {
        home.bookingOpen = false;
        home.servicesOpen = true;
        home.blogOpen = false;
        home.aboutOpen = false;
        home.closeMenu();
        $timeout(
          function () {
            const title = doc.getElementById("servicios-medicos-titulo");
            if (title) {
              title.focus({ preventScroll: true });
            }
            doc.getElementById("contenido").scrollIntoView();
          },
          0,
          false,
        );
      };

      home.openBlog = function () {
        home.bookingOpen = false;
        home.servicesOpen = false;
        home.blogOpen = true;
        home.aboutOpen = false;
        home.closeMenu();
        $timeout(
          function () {
            const title = doc.getElementById("blog-titulo");
            if (title) {
              title.focus({ preventScroll: true });
            }
            doc.getElementById("contenido").scrollIntoView();
          },
          0,
          false,
        );
      };

      home.openAbout = function () {
        home.bookingOpen = false;
        home.servicesOpen = false;
        home.blogOpen = false;
        home.aboutOpen = true;
        home.closeMenu();
        $timeout(
          function () {
            const title = doc.getElementById("nosotros-titulo");
            if (title) {
              title.focus({ preventScroll: true });
            }
            doc.getElementById("contenido").scrollIntoView();
          },
          0,
          false,
        );
      };
    },
  ]);
})();
