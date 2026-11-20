(function () {
  "use strict";

  const specialties = [];

  const benefits = [
    {
      id: "profesionales",
      name: "Profesionales calificados",
      description: "Un equipo de especialistas dedicado a tu salud.",
    },
    {
      id: "tecnologia",
      name: "Tecnología de vanguardia",
      description: "Herramientas que apoyan a tu médico en cada consulta.",
    },
    {
      id: "atencion",
      name: "Atención personalizada",
      description:
        "Escuchamos tus inquietudes y dedicamos tiempo a tus preguntas.",
    },
    {
      id: "servicio",
      name: "Servicio accesible",
      description: "Información clara para encontrar la atención que buscas.",
    },
  ];

  function normalizeName(value) {
    return (value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  angular
    .module("serviciosMedicosApp")
    .constant("medicalSpecialties", specialties)
    .directive("careCarouselScroll", [
      "$parse",
      function ($parse) {
        return {
          restrict: "A",
          link: function (scope, element, attrs) {
            const update = $parse(attrs.careCarouselScroll);
            const handler = function () {
              scope.$evalAsync(function () {
                update(scope);
              });
            };
            element.on("scroll", handler);
            scope.$on("$destroy", function () {
              element.off("scroll", handler);
            });
          },
        };
      },
    ])
    .run([
      "$http",
      "medicalSpecialties",
      function LoadMedicalSpecialties($http, medicalSpecialties) {
        $http
          .get("/api/specialties")
          .then(function (response) {
            medicalSpecialties.splice(
              0,
              medicalSpecialties.length,
              ...(response.data.specialties || []),
            );
          })
          .catch(function () {
            medicalSpecialties.splice(0, medicalSpecialties.length);
          });
      },
    ])
    .component("specialtyList", {
      templateUrl: "/components/specialties.html",
      bindings: { query: "<", onBook: "&", onClear: "&" },
      controller: [
        "$document",
        "$scope",
        "$timeout",
        "medicalSpecialties",
        function SpecialtyListController($document, $scope, $timeout, medicalSpecialties) {
        const ctrl = this;
        ctrl.canMoveLeft = false;
        ctrl.canMoveRight = false;
        ctrl.currentPage = 0;

        function applyFilter() {
          const term = normalizeName(ctrl.query);
          ctrl.filtered = medicalSpecialties.filter((item) =>
            normalizeName(item.name).includes(term),
          );
          $timeout(ctrl.updateCarouselState, 0, false);
        }

        ctrl.$onInit = applyFilter;
        ctrl.$onChanges = applyFilter;
        $scope.$watchCollection(
          function () { return medicalSpecialties; },
          applyFilter,
        );

        ctrl.requestBooking = function (specialty, event) {
          ctrl.onBook({ name: specialty.name, $event: event });
        };

        ctrl.move = function (direction) {
          const grid = $document[0].querySelector(".care-specialty-grid");
          if (!grid) return;
          const distance = grid.clientWidth * 0.75 * direction;
          grid.scrollBy({ left: distance, behavior: "smooth" });
          $timeout(ctrl.updateCarouselState, 350, false);
        };

        ctrl.updateCarouselState = function () {
          const grid = $document[0].querySelector(".care-specialty-grid");
          if (!grid) return;
          ctrl.canMoveLeft = grid.scrollLeft > 4;
          ctrl.canMoveRight =
            grid.scrollLeft + grid.clientWidth < grid.scrollWidth - 4;
          const cards = grid.querySelectorAll(".care-specialty-card");
          if (cards.length) {
            ctrl.currentPage = 0;
            let nearestDistance = Infinity;
            for (let index = 0; index < cards.length; index += 1) {
              const distance = Math.abs(
                cards[index].getBoundingClientRect().left -
                  grid.getBoundingClientRect().left,
              );
              if (distance < nearestDistance) {
                nearestDistance = distance;
                ctrl.currentPage = index;
              }
            }
          }
        };

        ctrl.goTo = function (index) {
          const grid = $document[0].querySelector(".care-specialty-grid");
          if (!grid) return;
          ctrl.currentPage = index;
          const card = grid.querySelectorAll(".care-specialty-card")[index];
          if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        };
      },
      ],
    })
    .component("careBenefits", {
      templateUrl: "/components/benefits.html",
      controller: function CareBenefitsController() {
        this.benefits = benefits;
      },
    });
})();
