(function () {
  "use strict";

  const specialties = [
    {
      id: "pediatria",
      name: "Pediatría",
      description: "Cuidamos la salud y el desarrollo de niñas y niños.",
    },
    {
      id: "cardiologia",
      name: "Cardiología",
      description: "Te acompañamos en el cuidado de tu corazón.",
    },
    {
      id: "ginecologia",
      name: "Ginecología",
      description: "Atención a tu salud en cada etapa de la vida.",
    },
    {
      id: "medicina-general",
      name: "Medicina General",
      description: "Una primera consulta para cuidar de toda tu familia.",
    },
  ];

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
    .component("specialtyList", {
      templateUrl: "/components/specialties.html",
      bindings: { query: "<", onBook: "&", onClear: "&" },
      controller: function SpecialtyListController() {
        this.$onChanges = function () {
          const term = normalizeName(this.query);
          this.filtered = specialties.filter((item) =>
            normalizeName(item.name).includes(term),
          );
        };

        this.requestBooking = function (specialty, event) {
          this.onBook({
            message:
              "La agenda de " +
              specialty.name +
              " estará disponible próximamente.",
            $event: event,
          });
        };
      },
    })
    .component("careBenefits", {
      templateUrl: "/components/benefits.html",
      controller: function CareBenefitsController() {
        this.benefits = benefits;
      },
    });
})();
