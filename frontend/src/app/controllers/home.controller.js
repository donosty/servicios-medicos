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
      home.catalogQuery = "";
      home.menuOpen = false;
      home.view = "home";
      home.bookingSpecialty = "";
      home.resumeBooking = false;
      home.sessionUser = null;

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
        home.view = "home";
        home.closeMenu();
      };

      function openView(view, titleId) {
        home.view = view;
        home.closeMenu();
        $timeout(
          function () {
            if (home.view !== view) return;
            const content = doc.getElementById("contenido");
            const title = titleId && doc.getElementById(titleId);
            (title || content).focus({ preventScroll: true });
            content.scrollIntoView();
          },
          0,
          false,
        );
      }

      home.openSpecialties = function (query) {
        home.catalogQuery = (query || "").trim();
        openView("specialties", "especialidades-catalogo-titulo");
      };

      home.openBooking = function (name) {
        home.resumeBooking = false;
        home.bookingSpecialty = name || "";
        openView("booking", "agenda-titulo");
      };

      home.closeBooking = function () {
        home.returnHome();
        $timeout(
          () => doc.querySelector(".header-actions .book-button").focus(),
          0,
          false,
        );
      };

      home.logout = function (event) {
        const trigger = event.currentTarget;
        api
          .logout()
          .then(function () {
            home.sessionUser = null;
            home.returnHome();
            $timeout(() => doc.querySelector(".brand-link").focus(), 0, false);
          })
          .catch(function () {
            home.showNotice("No fue posible cerrar la sesión.", {
              currentTarget: trigger,
            });
          });
      };

      home.openServices = function () {
        openView("services", "servicios-medicos-titulo");
      };

      home.openContact = function () {
        openView("contact");
      };

      home.openBlog = function () {
        openView("blog", "blog-titulo");
      };

      home.openAbout = function () {
        openView("about", "nosotros-titulo");
      };

      api.getSession().then(function (response) {
        home.sessionUser = response.data.user;
      }, angular.noop);

      const url = new URL($window.location.href);
      if (url.searchParams.get("cita") === "continuar") {
        url.searchParams.delete("cita");
        $window.history.replaceState(null, "", url);
        home.openBooking();
        home.resumeBooking = true;
      } else if (url.hash === "#especialidades") {
        home.openSpecialties();
      }
    },
  ]);
})();
