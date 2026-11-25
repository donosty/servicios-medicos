(function () {
  "use strict";

  angular.module("serviciosMedicosApp").component("specialtyList", {
    templateUrl: "/features/specialties/specialties.html",
    bindings: { onBook: "&", onCatalog: "&" },
    controller: [
      "$element",
      "$scope",
      "$timeout",
      "medicalSpecialties",
      function SpecialtyListController(
        $element,
        $scope,
        $timeout,
        medicalSpecialties,
      ) {
        const ctrl = this;
        ctrl.canMoveLeft = false;
        ctrl.canMoveRight = false;
        ctrl.currentPage = 0;

        const homeSpecialties = new Set([
          "neurologia", "traumatologia", "ortopedia", "cardiologia",
          "pediatria", "nutricion", "cirugia-maxilofacial", "cirugia-plastica",
          "psiquiatria", "medicina-general", "imagenologia",
        ]);
        ctrl.specialties = [];
        $scope.$watchCollection(
          function () {
            return medicalSpecialties;
          },
          function (specialties) {
            ctrl.specialties = specialties.filter((item) => homeSpecialties.has(item.id));
            $timeout(ctrl.updateCarouselState);
          },
        );

        ctrl.requestBooking = function (specialty, event) {
          ctrl.onBook({ name: specialty.name, $event: event });
        };

        ctrl.move = function (direction) {
          const grid = $element[0].querySelector(".care-specialty-grid");
          if (!grid) return;
          grid.scrollBy({
            left: grid.clientWidth * 0.75 * direction,
            behavior: "smooth",
          });
        };

        ctrl.updateCarouselState = function () {
          const grid = $element[0].querySelector(".care-specialty-grid");
          if (!grid) {
            ctrl.canMoveLeft = false;
            ctrl.canMoveRight = false;
            ctrl.currentPage = 0;
            return;
          }

          ctrl.canMoveLeft = grid.scrollLeft > 4;
          ctrl.canMoveRight =
            grid.scrollLeft + grid.clientWidth < grid.scrollWidth - 4;

          const cards = grid.querySelectorAll(".care-specialty-card");
          if (cards.length) {
            ctrl.currentPage = 0;
            let nearestDistance = Infinity;
            Array.from(cards).forEach(function (card, index) {
              const distance = Math.abs(
                card.getBoundingClientRect().left -
                  grid.getBoundingClientRect().left,
              );
              if (distance < nearestDistance) {
                nearestDistance = distance;
                ctrl.currentPage = index;
              }
            });
          }
        };

        ctrl.goTo = function (index) {
          const grid = $element[0].querySelector(".care-specialty-grid");
          if (!grid) return;
          ctrl.currentPage = index;
          const card = grid.querySelectorAll(".care-specialty-card")[index];
          if (card) {
            card.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "start",
            });
          }
        };
      },
    ],
  });
})();
