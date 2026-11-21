(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
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
            const resizeObserver = new ResizeObserver(handler);
            resizeObserver.observe(element[0]);

            scope.$on("$destroy", function () {
              element.off("scroll", handler);
              resizeObserver.disconnect();
            });
          },
        };
      },
    ]);
})();
