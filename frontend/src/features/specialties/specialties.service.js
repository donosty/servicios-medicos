(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .constant("medicalSpecialties", [])
    .run([
      "api",
      "medicalSpecialties",
      function LoadMedicalSpecialties(api, medicalSpecialties) {
        const fallback = [
          {
            id: "neurologia",
            name: "Neurología",
            description:
              "Diagnóstico y atención integral de trastornos del sistema nervioso.",
            icon: "/assets/icons/neurologia.webp",
          },
          {
            id: "traumatologia",
            name: "Traumatología",
            description:
              "Atención especializada de lesiones traumáticas y del sistema musculoesquelético.",
            icon: "/assets/icons/traumatologia.webp",
          },
          {
            id: "ortopedia",
            name: "Ortopedia",
            description:
              "Tratamiento de huesos, articulaciones y problemas de movimiento.",
            icon: "/assets/icons/ortopedia.webp",
          },
          {
            id: "cardiologia",
            name: "Cardiología",
            description:
              "Prevención, diagnóstico y cuidado integral de tu corazón.",
            icon: "/assets/icons/cardiologia.webp",
          },
          {
            id: "pediatria",
            name: "Pediatría",
            description: "Cuidamos la salud y el desarrollo de niñas y niños.",
            icon: "/assets/icons/pediatria.webp",
          },
          {
            id: "nutricion",
            name: "Nutrición",
            description:
              "Acompañamiento personalizado para una alimentación saludable.",
            icon: "/assets/icons/nutricion.webp",
          },
        ];

        api
          .getSpecialties()
          .then(function (response) {
            const specialties = response.data.specialties || [];
            medicalSpecialties.splice(
              0,
              medicalSpecialties.length,
              ...(specialties.length ? specialties : fallback),
            );
          })
          .catch(function () {
            medicalSpecialties.splice(
              0,
              medicalSpecialties.length,
              ...fallback,
            );
          });
      },
    ]);
})();
