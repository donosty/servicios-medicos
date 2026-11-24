(function () {
  "use strict";

  angular.module("serviciosMedicosApp").component("careBenefits", {
    templateUrl: "/features/care/benefits.html",
    controller: function CareBenefitsController() {
      this.benefits = [
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
          description:
            "Información clara para encontrar la atención que buscas.",
        },
      ];
    },
  });
})();
