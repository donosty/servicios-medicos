(function () {
  "use strict";

  angular.module("serviciosMedicosApp").factory("stringUtils", [
    function StringUtils() {
      return {
        normalizeName: function (value) {
          return (value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        },
      };
    },
  ]);
})();
