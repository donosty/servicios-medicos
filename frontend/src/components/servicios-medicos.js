(function () {
  "use strict";

  angular
    .module("serviciosMedicosApp")
    .controller("ServiciosMedicosController", [
      function ServiciosMedicosController() {
        const ctrl = this;
        ctrl.searchText = "";
        ctrl.selectedCategory = "Todos los Servicios";
        ctrl.categories = [
          "Todos los Servicios",
          "Consultas Médicas",
          "Diagnóstico e Imagen",
          "Laboratorio Clínico",
          "Cirugía Ambulatoria",
          "Urgencias 24/7",
        ];

        ctrl.services = [
          {
            id: 1,
            category: "Consultas Médicas",
            icon: "♧",
            title: "Consulta Especializada",
            description:
              "Cardiología, pediatría, neurología y más de 20 disciplinas importantes por médicos.",
            features: [
              "25+ Médicos especialistas certificados",
              "Citas presenciales y en el mismo día",
            ],
            specialtyName: "Cardiología",
          },
          {
            id: 2,
            category: "Laboratorio Clínico",
            icon: "⚗",
            title: "Laboratorio Clínico Automatizado",
            description:
              "Análisis clínicos precisos de sangre, perfiles bioquímicos, inmunología y estudios especializados.",
            features: [
              "Entrega de resultados digitales el mismo día",
              "Acceso seguro encriptado desde el portal",
            ],
            specialtyName: "Análisis Clínicos",
          },
          {
            id: 3,
            category: "Diagnóstico e Imagen",
            icon: "▦",
            title: "Ultrasonido y Rayos X Digital",
            description:
              "Imagenología diagnóstica digital de alta definición, ecografía Doppler, color y rayos X.",
            features: [
              "Informe radiológico detallado en menos de 24 hrs",
              "Interpretado por médicos subespecialistas",
            ],
            specialtyName: "Imagenología",
          },
          {
            id: 4,
            category: "Preventivo",
            icon: "♡",
            title: "Check-up Preventivo Integral",
            description:
              "Protocolos diseñados por rango de edad que integran electrocardiograma, pruebas y consultas.",
            features: [
              "Valoración médica integral en una sola sesión",
              "Plan personalizado y reporte con recomendaciones",
            ],
            specialtyName: "Medicina General",
          },
          {
            id: 5,
            category: "Cirugía Ambulatoria",
            icon: "▱",
            title: "Cirugía Ambulatoria y Endoscopia",
            description:
              "Salas quirúrgicas estériles y unidades de recuperación inmediata para procedimientos seguros.",
            features: [
              "Alta médica y recuperación segura el mismo día",
              "Protocolos antisépticos con estándares mundiales",
            ],
            specialtyName: "Cirugía General",
          },
          {
            id: 6,
            category: "Urgencias 24/7",
            icon: "⊕",
            title: "Urgencias y Triaje Continuo",
            description:
              "Guardia médica permanente los 365 días del año con clasificación inmediata.",
            features: [
              "Atención inmediata en cita previa",
              "Enlace directo con unidades de ambulancia",
            ],
            specialtyName: "Urgencias",
          },
        ];

        ctrl.visibleServices = ctrl.services.slice();

        ctrl.filterServices = function () {
          const term = (ctrl.searchText || "").trim().toLowerCase();
          ctrl.visibleServices = ctrl.services.filter(function (service) {
            const matchesCategory =
              ctrl.selectedCategory === "Todos los Servicios" ||
              service.category === ctrl.selectedCategory;
            const searchable = [
              service.category,
              service.title,
              service.description,
              service.features.join(" "),
            ]
              .join(" ")
              .toLowerCase();
            return matchesCategory && (!term || searchable.includes(term));
          });
        };

        ctrl.selectCategory = function (category) {
          ctrl.selectedCategory = category;
          ctrl.filterServices();
        };
      },
    ])
    .component("medicalServices", {
      templateUrl: "/components/servicios-medicos.html",
      bindings: { onClose: "&", onBook: "&" },
      controller: "ServiciosMedicosController",
    });
})();
