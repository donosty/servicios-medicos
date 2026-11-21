(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .run([
      "api",
      "$window",
      function AuthGuard(api, $window) {
        api.getSession()
          .then(function (response) {
            if (response.data.user.role === "administrador") {
              $window.location.replace("/admin.html");
            }
          })
          .catch(function () {
            $window.location.replace("/login.html");
          });
      },
    ]);
})();
